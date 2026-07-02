import {
    toPasskeyTransport,
    toWebAuthnCredential,
    WebAuthnMode,
} from '@circle-fin/modular-wallets-core'

// 0. retrieve client key and client url from environment vars
const clientKey = process.env.TEST_CLIENT_KEY
const clientUrl = process.env.CIRCLE_CLIENT_URL

// 1. register or login with a passkey and
//    Create a Passkey Transport from client key
const passkeyTransport = toPasskeyTransport(clientUrl, clientKey)
const credential = await toWebAuthnCredential({
    transport: passkeyTransport,
    mode: WebAuthnMode.Register, // or WebAuthnMode.Login if login
    username: 'your-username' // replace with actual username
})