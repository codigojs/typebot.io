import { createAction, option } from '@typebot.io/forge'
import { auth } from '../auth'
import ky from 'ky'

interface WooCommerceCustomer {
  id: number
  email: string
  first_name: string
  last_name: string
  username: string
  billing: {
    address_1: string
    city: string
    country: string
    phone: string
  }
}

export const getCustomer = createAction({
  name: 'Buscar cliente',
  auth,
  options: option.object({
    querySearch: option.string.layout({
      label: 'Término de búsqueda',
      placeholder: 'Ingrese el termino de busqueda (nombre y apellidos)',
    }),
    clientEmail: option.string.layout({
      label: 'Correo electrónico',
      placeholder: 'Ingrese el correo electrónico del cliente',
    }),
    responseMapping: option
      .saveResponseArray([
        'ID',
        'Email',
        'Nombre',
        'Apellido',
        'Nombre de usuario',
        'Dirección',
        'Ciudad',
        'País',
        'Teléfono',
      ])
      .layout({
        accordion: 'Guardar respuesta',
      }),
  }),
  getSetVariableIds: ({ responseMapping }) =>
    responseMapping?.map((item) => item.variableId).filter(Boolean) as string[],
  run: {
    server: async ({ credentials, options, variables, logs }) => {
      const { url, clientKey, clientSecret } = credentials
      const { querySearch, clientEmail, responseMapping } = options

      if (!url || !clientKey || !clientSecret) {
        return logs.add('Faltan credenciales de WooCommerce')
      }

      if (!querySearch && !clientEmail) {
        return logs.add('Faltan parámetros de búsqueda')
      }

      const baseUrl = `${url}customers`
      const authString = btoa(`${clientKey}:${clientSecret}`)

      try {
        const searchQuery = `${clientEmail ? `email=${clientEmail}&` : ''}${
          querySearch ? `search=${querySearch}` : ''
        }`.replace(/&$/, '')
        const response = await ky.get(`${baseUrl}?${searchQuery}`, {
          headers: {
            Authorization: `Basic ${authString}`,
          },
        })

        if (!response.ok) {
          throw new Error(`Error HTTP! estado: ${response.status}`)
        }

        const customers = (await response.json()) as WooCommerceCustomer[]

        if (customers.length === 0) {
          return logs.add('No se encontraron clientes')
        }

        const customer = customers[0]

        responseMapping?.forEach((mapping) => {
          if (!mapping.variableId) return

          let value
          switch (mapping.item) {
            case 'ID':
              value = customer.id
              break
            case 'Email':
              value = customer.email
              break
            case 'Nombre':
              value = customer.first_name
              break
            case 'Apellido':
              value = customer.last_name
              break
            case 'Nombre de usuario':
              value = customer.username
              break
            case 'Dirección':
              value = customer.billing.address_1
              break
            case 'Ciudad':
              value = customer.billing.city
              break
            case 'País':
              value = customer.billing.country
              break
            case 'Teléfono':
              value = customer.billing.phone
              break
          }

          variables.set(mapping.variableId, value)
        })
      } catch (error) {
        logs.add({
          status: 'error',
          description: 'Error al obtener el cliente',
          details: error instanceof Error ? error.message : String(error),
        })
      }
    },
  },
})
