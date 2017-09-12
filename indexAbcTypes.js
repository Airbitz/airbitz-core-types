/**
 * Created by paul on 8/26/17.
 */
// @flow

// io types -----------------------------------------------------------

export interface DiskletFile {
  delete(): Promise<void>,
  getData(): Promise<Uint8Array>,
  getText(): Promise<string>,
  setData(data: Array<number> | Uint8Array): Promise<void>,
  setText(text: string): Promise<void>
}

export interface DiskletFolder {
  delete(): Promise<void>,
  file(name: string): DiskletFile,
  folder(name: string): DiskletFolder,
  listFiles(): Promise<Array<string>>,
  listFolders(): Promise<Array<string>>
}

// Browser fetch function:
export type FetchFunction = typeof fetch

// Node.js randomBytes function:
export type RandomFunction = (bytes: number) => Uint8Array

// TODO: The node.js `net` interface:
export interface NodeNet {}

// The only subset of `Console` that Airbitz uses:
export interface AbcConsole {
  error(...data: Array<any>): void,
  info(...data: Array<any>): void,
  warn(...data: Array<any>): void
}

// The scrypt function Airbitz expects:
export type AbcScryptFunction = (
  data: Uint8Array,
  salt: Uint8Array,
  n: number,
  r: number,
  p: number,
  dklen: number
) => Promise<Uint8Array>

export type AbcIo = {
  // Must-have items:
  fetch: FetchFunction,
  random: RandomFunction,

  // Optional items (the core will use JS versions):
  console?: AbcConsole,
  folder?: DiskletFolder,
  localStorage?: Storage,
  net?: NodeNet,
  scrypt?: AbcScryptFunction
}

// context types ------------------------------------------------------

export interface AbcContextCallbacks {
  onError?: (e: Error) => void
}

/* eslint-disable no-use-before-define */
export type AbcContextOptions = {
  apiKey?: string,
  appId?: string,
  authServer?: string,
  callbacks?: AbcContextCallbacks,
  io?: AbcIo,
  plugins?: Array<AbcCurrencyPluginFactory | AbcExchangePluginFactory>
}

export type AbcMakeContextOpts = AbcContextOptions

export interface AbcContext {}

// account types ------------------------------------------------------

export type AbcWalletInfo = {
  id?: string,
  type: string,
  keys: any
}

export type AbcWalletState = {
  archived?: boolean,
  deleted?: boolean,
  sortIndex?: number
}

export type AbcWalletStates = {
  [walletId: string]: AbcWalletState
}

export interface AbcAccountCallbacks {
  onDataChanged(): void,
  onKeyListChanged(): void,
  onLoggedOut(): void,
  onOTPRequired(): void,
  onOTPSkew(): void,
  onRemotePasswordChange(): void
}

export type AbcAccountOptions = {
  otp: string,
  callbacks: AbcAccountCallbacks
}

export interface AbcAccount {
  // appId?:string,
  // username?:string,
  // loginKey?:string,
  // exchangeCache?:any,
  // loggedIn?:boolean,
  // edgeLogin?:boolean,
  keyLogin: boolean,
  pinLogin: boolean,
  passwordLogin: boolean,
  newAccount: boolean,
  recoveryLogin: boolean,
  isLoggedIn(): boolean,
  logout(): Promise<void>,
  passwordOk(password: string): Promise<boolean>,
  checkPassword(password: string): Promise<boolean>,
  passwordSetup(password: string): Promise<void>,
  changePassword(password: string): Promise<void>,
  pinSetup(password: string): Promise<void>,
  changePIN(password: string): Promise<void>,
  recovery2Set(questions: string, answers: string): Promise<string>,
  setupRecovery2Questions(questions: string, answers: string): Promise<string>,
  changeWalletStates(walletStates: AbcWalletStates): Promise<void>,
  changeKeyStates(walletStates: AbcWalletStates): Promise<void>,
  listWalletIds(): Array<string>,
  getWallet(id: string): AbcWalletInfo,
  getWalletInfo(id: string): AbcWalletInfo,
  getFirstWallet(type: string): AbcWalletInfo,
  getFirstWalletInfo(type: string): AbcWalletInfo,
  createWallet(type: string, keys: any): string
}

// currency wallet types ----------------------------------------------

export interface AbcCurrencyWallet {}

export type AbcMetadata = {
  name?: string,
  category?: string,
  notes?: string,
  amountFiat?: number,
  bizId?: number,
  miscJson?: string
}

export type AbcSpendTarget = {
  currencyCode?: string,
  destWallet?: any,
  publicAddress?: string,
  nativeAmount?: string,
  destMetadata?: AbcMetadata
}

export type AbcSpendInfo = {
  currencyCode?: string,
  noUnconfirmed?: boolean,
  spendTargets: Array<AbcSpendTarget>,
  networkFeeOption?: string,
  customNetworkFee?: string,
  metadata?: AbcMetadata
}

export type AbcTransaction = {
  txid: string,
  date: number,
  currencyCode: string,
  blockHeight: number,
  nativeAmount: string,
  networkFee: string,
  ourReceiveAddresses: Array<string>,
  signedTx: string,
  otherParams: any
}

export interface AbcDenomination {
  name: string,
  multiplier: string,
  symbol?: string
}

export interface AbcMetaToken {
  currencyCode: string,
  currencyName: string,
  denominations: Array<AbcDenomination>,
  contractAddress?: string,
  symbolImage?: string
}

export type AbcCurrencyInfo = {
  walletTypes: Array<string>,
  currencyName: string,
  currencyCode: string,
  addressExplorer: string,
  transactionExplorer: string,
  defaultSettings: any,
  denominations: Array<AbcDenomination>,
  symbolImage?: string,
  metaTokens: Array<AbcMetaToken>
}

export type AbcParsedUri = {
  publicAddress: string,
  nativeAmount?: string,
  currencyCode?: string,
  label?: string,
  message?: string
}

export type AbcEncodeUri = {
  publicAddress: string,
  nativeAmount?: string,
  label?: string,
  message?: string
}

// currency plugin types ----------------------------------------------

export interface AbcCurrencyEngine {
  updateSettings(settings: any): void,
  startEngine(): Promise<void>,
  killEngine(): void,
  getBlockHeight(): number,
  enableTokens(tokens: Array<string>): void,
  getTokenStatus(token: string): boolean,
  getBalance(options: any): string,
  getNumTransactions(options: any): number,
  getTransactions(options: any): Promise<Array<AbcTransaction>>,
  getFreshAddress(options: any): string,
  addGapLimitAddresses(addresses: Array<string>, options: any): void,
  isAddressUsed(address: string, options: any): boolean,
  makeSpend(abcSpendInfo: AbcSpendInfo): Promise<AbcTransaction>,
  signTx(abcTransaction: AbcTransaction): Promise<AbcTransaction>,
  broadcastTx(abcTransaction: AbcTransaction): Promise<AbcTransaction>,
  saveTx(abcTransaction: AbcTransaction): Promise<void>
}

export type AbcCurrencyPlugin = {
  pluginName: string,
  currencyInfo: AbcCurrencyInfo,
  createPrivateKey(walletType: string): any,
  derivePublicKey(walletInfo: AbcWalletInfo): any,
  makeEngine(keyInfo: any, opts: any): AbcCurrencyEngine,
  parseUri(uri: string): AbcParsedUri,
  encodeUri(obj: AbcEncodeUri): string
}

export type AbcMakeCurrencyPlugin = (opts: any) => Promise<AbcCurrencyPlugin>

export type AbcCurrencyPluginCallbacks = {
  onBlockHeightChanged(blockHeight: number): void,
  onTransactionsChanged(abcTransactions: Array<AbcTransaction>): void,
  onBalanceChanged(currencyCode: string, nativeBalance: string): void,
  onAddressesChecked(progressRatio: number): void
}

export type AbcMakeEngineOptions = {
  walletLocalFolder: any,
  callbacks: AbcCurrencyPluginCallbacks,
  optionalSettings?: any
}

export interface AbcCurrencyPluginFactory {
  pluginType: 'currency',
  static makePlugin(opts: { io: AbcIo }): Promise<AbcCurrencyPlugin>
}

// exchange plugin types ----------------------------------------------

export interface AbcExchangePairHint {
  fromCurrency: string,
  toCurrency: string
}

export interface AbcExchangePair {
  fromCurrency: string,
  toCurrency: string,
  rate: number
}

export interface AbcExchangePlugin {
  exchangeInfo: { exchangeName: string },

  fetchExchangeRates(
    pairHints: Array<AbcExchangePairHint>
  ): Array<AbcExchangePair>
}

export interface AbcExchangePluginFactory {
  pluginType: 'exchange',
  static makePlugin(opts: { io: AbcIo }): Promise<AbcExchangePlugin>
}

// JSON API schemas ---------------------------------------------------

export const AbcEthFeesSchema = {
  'type': 'object',
  'additionalProperties': {
    'type': 'object',
    'properties': {
      'gasLimit': {
        'type': 'object',
        'properties': {
          'regularTransaction': { 'type': 'string' },
          'tokenTransaction': { 'type': 'string' }
        },
        'required': [ 'regularTransaction', 'tokenTransaction' ]
      },
      'gasPrice': {
        'type': 'object',
        'properties': {
          'lowFee': { 'type': 'string' },
          'standardFeeLow': { 'type': 'string' },
          'standardFeeHigh': { 'type': 'string' },
          'standardFeeLowAmount': { 'type': 'string' },
          'standardFeeHighAmount': { 'type': 'string' },
          'highFee': { 'type': 'string' }
        },
        'required': [ 'lowFee', 'standardFeeLow', 'standardFeeHigh', 'standardFeeLowAmount', 'standardFeeHighAmount', 'highFee' ]
      }
    },
    'required': [ 'gasLimit' ]
  }
}

export const AbcCurrencyInfoSchema = {
  'type': 'object',
  'properties': {
    'walletTypes': {
      'type': 'array',
      'items': {'type': 'string'}
    },
    'currencyCode': { 'type': 'string' },
    'currencyName': { 'type': 'string' },
    'addressExplorer': { 'type': 'string' },
    'transactionExplorer': { 'type': 'string' },
    'denominations': {
      'type': 'array',
      'items': {
        'type': 'object',
        'properties': {
          'name': { 'type': 'string' },
          'multiplier': { 'type': 'string' },
          'symbol': { 'type': 'string' }
        },
        'required': [ 'name', 'multiplier' ]
      }
    },
    'symbolImage': { 'type': 'string' },
    'metaTokens': {
      'type': 'array',
      'items': {
        'type': 'object',
        'properties': {
          'currencyCode': { 'type': 'string' },
          'currencyName': { 'type': 'string' },
          'denominations': {
            'type': 'array',
            'items': {
              'type': 'object',
              'properties': {
                'name': { 'type': 'string' },
                'multiplier': { 'type': 'string' },
                'symbol': { 'type': 'string' }
              },
              'required': [ 'name', 'multiplier' ]
            }
          },
          'contractAddress': { 'type': 'string' },
          'symbolImage': { 'type': 'string' }
        },
        'required': [ 'currencyCode', 'currencyName', 'denominations' ]
      }
    }
  },
  'required': [
    'walletTypes',
    'currencyCode',
    'currencyName',
    'defaultSettings',
    'denominations',
    'symbolImage',
    'addressExplorer',
    'transactionExplorer'
  ]
}
