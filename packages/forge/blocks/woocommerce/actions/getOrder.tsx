import { createAction, option } from '@typebot.io/forge'
import { auth } from '../auth'
import ky from 'ky'

import { WooCommerceOrder } from '../models'

export const getOrder = createAction({
  name: 'Get Order',
  auth,
  options: option.object({
    orderId: option.string.layout({
      label: 'Order ID',
      placeholder: 'Enter the order ID',
    }),
    responseMapping: option
      .saveResponseArray([
        'ID',
        'Status',
        'Total',
        'Currency',
        'Creation Date',
        'Customer Note',
        'Customer Name',
        'Customer Email',
        'Products',
        'Shipping',
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
      const { orderId, responseMapping } = options

      if (!url || !clientKey || !clientSecret) {
        return logs.add('Missing WooCommerce credentials')
      }

      if (!orderId) {
        return logs.add('Missing order ID')
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
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const order = (await response.json()) as WooCommerceOrder

        responseMapping?.forEach((mapping) => {
          if (!mapping.variableId) return

          let value
          switch (mapping.item) {
            case 'ID':
              value = order.id
              break
            case 'Status':
              value = order.status
              break
            case 'Total':
              value = order.total
              break
            case 'Currency':
              value = order.currency
              break
            case 'Creation Date':
              value = order.date_created
              break
            case 'Customer Note':
              value = order.customer_note
              break
            case 'Customer Name':
              value = `${order.billing.first_name} ${order.billing.last_name}`
              break
            case 'Customer Email':
              value = order.billing.email
              break
            case 'Products':
              value = order.line_items
              break
            case 'Shipping':
              value = order.shipping_lines
              break
          }

          variables.set(mapping.variableId, value)
        })
      } catch (error) {
        logs.add({
          status: 'error',
          description: 'Error getting the order',
          details: error instanceof Error ? error.message : String(error),
        })
      }
    },
  },
})
