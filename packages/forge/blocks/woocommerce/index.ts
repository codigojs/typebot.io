import { createBlock } from '@typebot.io/forge'
import { WoocommerceLogo } from './logo'
import { auth } from './auth'
import { getCustomer } from './actions/getCustomer'
import { getOrder } from './actions/getOrder'

export const woocommerceBlock = createBlock({
  id: 'woocommerce',
  name: 'Woocommerce',
  tags: ['woocommerce'],
  LightLogo: WoocommerceLogo,
  auth,
  actions: [getCustomer, getOrder],
})
