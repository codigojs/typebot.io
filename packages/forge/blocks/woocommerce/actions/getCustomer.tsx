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
  name: 'Search Customer',
  auth,
  options: option.object({
    querySearch: option.string.layout({
      label: 'Search term',
      placeholder: 'Enter the search term (name and last name)',
    }),
    clientEmail: option.string.layout({
      label: 'Email',
      placeholder: 'Enter the email of the customer',
    }),
    responseMapping: option
      .saveResponseArray([
        'ID',
        'Email',
        'Name',
        'Last Name',
        'Username',
        'Address',
        'City',
        'Country',
        'Phone',
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
      const { querySearch, clientEmail, responseMapping } = options

      if (!url || !clientKey || !clientSecret) {
        return logs.add('Missing WooCommerce credentials')
      }

      if (!querySearch && !clientEmail) {
        return logs.add('Missing search parameters')
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
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const customers = (await response.json()) as WooCommerceCustomer[]

        if (customers.length === 0) {
          return logs.add('No customers found')
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
            case 'Name':
              value = customer.first_name
              break
            case 'Last Name':
              value = customer.last_name
              break
            case 'Username':
              value = customer.username
              break
            case 'Address':
              value = customer.billing.address_1
              break
            case 'City':
              value = customer.billing.city
              break
            case 'Country':
              value = customer.billing.country
              break
            case 'Phone':
              value = customer.billing.phone
              break
          }

          variables.set(mapping.variableId, value)
        })
      } catch (error) {
        logs.add({
          status: 'error',
          description: 'Error getting the customer',
          details: error instanceof Error ? error.message : String(error),
        })
      }
    },
  },
})
