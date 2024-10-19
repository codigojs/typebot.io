import { createBlock } from '@typebot.io/forge'
import { WoocommerceLogo } from './logo'
import { auth } from './auth'
import { getOrder } from './actions/getOrder'
import { getCustomer } from './actions/getCustomer'

export const woocommerceBlock = createBlock({
  id: 'woocommerce',
  name: 'Woocommerce',
  tags: [],
  LightLogo: WoocommerceLogo,
  auth,
  actions: [getOrder, getCustomer],
})
