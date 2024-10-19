import { createAction, option } from '@typebot.io/forge'
import { auth } from '../auth'
import ky, { HTTPError } from 'ky'

interface WooCommerceProduct {
  id: number
  name: string
  price: string
  regular_price: string
  sale_price: string
  description: string
  short_description: string
  categories: { name: string }[]
  images: { src: string }[]
}

export const getProduct = createAction({
  name: 'Obtener producto',
  auth,
  options: option.object({
    productId: option.string.layout({
      label: 'ID del producto',
      placeholder: 'Ingrese el ID del producto',
    }),
    responseMapping: option
      .saveResponseArray([
        'ID',
        'Nombre',
        'Precio',
        'Precio regular',
        'Precio de oferta',
        'Descripción',
        'Descripción corta',
        'Categorías',
        'Imágenes',
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
      const { productId, responseMapping } = options

      if (!url || !clientKey || !clientSecret) {
        return logs.add('Faltan credenciales de WooCommerce')
      }

      if (!productId) {
        return logs.add('Falta el ID del producto')
      }

      const baseUrl = `${url}products/${productId}`

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

        const product = (await response.json()) as WooCommerceProduct

        responseMapping?.forEach((mapping) => {
          if (!mapping.variableId) return

          let value
          switch (mapping.item) {
            case 'ID':
              value = product.id
              break
            case 'Nombre':
              value = product.name
              break
            case 'Precio':
              value = product.price
              break
            case 'Precio regular':
              value = product.regular_price
              break
            case 'Precio de oferta':
              value = product.sale_price
              break
            case 'Descripción':
              value = product.description
              break
            case 'Descripción corta':
              value = product.short_description
              break
            case 'Categorías':
              value = product.categories.map((cat: any) => cat.name).join(', ')
              break
            case 'Imágenes':
              value = product.images.map((img: any) => img.src).join(', ')
              break
          }

          variables.set(mapping.variableId, value)
        })
      } catch (error) {
        logs.add({
          status: 'error',
          description: 'Error al obtener el producto',
          details: error instanceof Error ? error.message : String(error),
        })
      }
    },
  },
})
