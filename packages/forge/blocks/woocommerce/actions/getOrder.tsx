import { createAction, option } from '@typebot.io/forge'
import { auth } from '../auth'
import ky from 'ky'

import { WooCommerceOrder } from '../models'

export const getOrder = createAction({
  name: 'Obtener pedido',
  auth,
  options: option.object({
    orderId: option.string.layout({
      label: 'ID del pedido',
      placeholder: 'Ingrese el ID del pedido',
    }),
    responseMapping: option
      .saveResponseArray([
        'ID',
        'Estado',
        'Total',
        'Moneda',
        'Fecha de creación',
        'Nota del cliente',
        'Nombre del cliente',
        'Email del cliente',
        'Productos',
        'Envío',
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
      const { orderId, responseMapping } = options

      if (!url || !clientKey || !clientSecret) {
        return logs.add('Faltan credenciales de WooCommerce')
      }

      if (!orderId) {
        return logs.add('Falta el ID del pedido')
      }

      const baseUrl = `${url}orders/${orderId}`
      const authString = btoa(`${clientKey}:${clientSecret}`)

      try {
        const response = await ky.get(baseUrl, {
          headers: {
            Authorization: `Basic ${authString}`,
          },
        })

        if (!response.ok) {
          throw new Error(`Error HTTP! estado: ${response.status}`)
        }

        const order = (await response.json()) as WooCommerceOrder
        console.log(order)

        responseMapping?.forEach((mapping) => {
          if (!mapping.variableId) return

          let value
          switch (mapping.item) {
            case 'ID':
              value = order.id
              break
            case 'Estado':
              value = order.status
              break
            case 'Total':
              value = order.total
              break
            case 'Moneda':
              value = order.currency
              break
            case 'Fecha de creación':
              value = order.date_created
              break
            case 'Nota del cliente':
              value = order.customer_note
              break
            case 'Nombre del cliente':
              value = `${order.billing.first_name} ${order.billing.last_name}`
              break
            case 'Email del cliente':
              value = order.billing.email
              break
            case 'Productos':
              value = order.line_items
              break
            case 'Envío':
              value = order.shipping_lines
              break
          }

          variables.set(mapping.variableId, value)
        })
      } catch (error) {
        logs.add({
          status: 'error',
          description: 'Error al obtener el pedido',
          details: error instanceof Error ? error.message : String(error),
        })
      }
    },
  },
})
