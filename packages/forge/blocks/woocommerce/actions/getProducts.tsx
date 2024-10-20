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
  name: 'Get Product',
  auth,
  options: option.object({
    productId: option.string.layout({
      label: 'Product ID',
      placeholder: 'Enter the product ID',
    }),
    responseMapping: option
      .saveResponseArray([
        'ID',
        'Name',
        'Price',
        'Regular Price',
        'Sale Price',
        'Description',
        'Short Description',
        'Categories',
        'Images',
      ])
      .layout({
        accordion: 'Save response',
      }),
  }),
  getSetVariableIds: ({ responseMapping }) =>
    responseMapping?.map((item) => item.variableId).filter(Boolean) as string[],
  run: {
    server: async ({ credentials, options, variables, logs }) => {
      const { url, clientKey, clientSecret } = credentials
      const { productId, responseMapping } = options

      if (!url || !clientKey || !clientSecret) {
        return logs.add('Missing WooCommerce credentials')
      }

      if (!productId) {
        return logs.add('Missing product ID')
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
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const product = (await response.json()) as WooCommerceProduct

        responseMapping?.forEach((mapping) => {
          if (!mapping.variableId) return

          let value
          switch (mapping.item) {
            case 'ID':
              value = product.id
              break
            case 'Name':
              value = product.name
              break
            case 'Price':
              value = product.price
              break
            case 'Regular Price':
              value = product.regular_price
              break
            case 'Sale Price':
              value = product.sale_price
              break
            case 'Description':
              value = product.description
              break
            case 'Short Description':
              value = product.short_description
              break
            case 'Categories':
              value = product.categories.map((cat: any) => cat.name).join(', ')
              break
            case 'Images':
              value = product.images.map((img: any) => img.src).join(', ')
              break
          }

          variables.set(mapping.variableId, value)
        })
      } catch (error) {
        logs.add({
          status: 'error',
          description: 'Error getting the product',
          details: error instanceof Error ? error.message : String(error),
        })
      }
    },
  },
})
