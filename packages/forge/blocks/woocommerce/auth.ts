import { option, AuthDefinition } from '@typebot.io/forge'

export const auth = {
  type: 'encryptedCredentials',
  name: 'Woocommerce account',
  schema: option.object({
    url: option.string.layout({
      label: 'URL',
      isRequired: true,
      helperText: 'URL Woocommerce Store',
      withVariableButton: false,
      isDebounceDisabled: true,
    }),
    clientKey: option.string.layout({
      label: 'Client Key',
      isRequired: true,
      inputType: 'password',
      helperText: 'Client Key Woocommerce Store',
      withVariableButton: false,
      isDebounceDisabled: true,
    }),
    clientSecret: option.string.layout({
      label: 'Secret Key',
      isRequired: true,
      inputType: 'password',
      helperText: 'Secret Key Woocommerce Store',
      withVariableButton: false,
      isDebounceDisabled: true,
    }),
  }),
} satisfies AuthDefinition
