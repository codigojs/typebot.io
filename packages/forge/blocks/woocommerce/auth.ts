import { option, AuthDefinition } from '@typebot.io/forge'

export const auth = {
  type: 'encryptedCredentials',
  name: 'Woocommerce account',
  schema: option.object({
    url: option.string.layout({
      label: 'URL',
      isRequired: true,
      helperText: 'The URL of your WooCommerce store.',
      withVariableButton: false,
      isDebounceDisabled: true,
    }),
    clientKey: option.string.layout({
      label: 'Client key',
      isRequired: true,
      inputType: 'password',
      helperText: 'You can generate an API key [here](<INSERT_URL>).',
      withVariableButton: false,
      isDebounceDisabled: true,
    }),
    clientSecret: option.string.layout({
      label: 'Client secret',
      isRequired: true,
      inputType: 'password',
      helperText: 'You can generate an API secret [here](<INSERT_URL>).',
      withVariableButton: false,
      isDebounceDisabled: true,
    }),
  }),
} satisfies AuthDefinition
