/**
 * Created by paul on 8/26/17.
 */
// @flow

// io types -----------------------------------------------------------

export interface DiskletFile {
  delete(): Promise<void>;
  getData(): Promise<Uint8Array>;
  getText(): Promise<string>;
  setData(data: Array<number> | Uint8Array): Promise<void>;
  setText(text: string): Promise<void>;
}

export interface DiskletFolder {
  delete(): Promise<void>;
  file(name: string): DiskletFile;
  folder(name: string): DiskletFolder;
  listFiles(): Promise<Array<string>>;
  listFolders(): Promise<Array<string>>;
}

// Browser fetch function:
export type FetchFunction = typeof fetch

// Node.js randomBytes function:
export type RandomFunction = (bytes: number) => Uint8Array

// TODO: The node.js `net` interface:
export interface NodeNet {}

// The only subset of `Console` that Airbitz uses:
export interface AbcConsole {
  error(...data: Array<any>): void;
  info(...data: Array<any>): void;
  warn(...data: Array<any>): void;
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

export type AbcPublicKeyCreateFunction = (
  privateKey: Uint8Array,
  compressed: boolean
) => Promise<string>

export type AbcPrivateKeyTweakAddFunction = (
  privateKey: Uint8Array,
  tweak: Uint8Array
) => Promise<Uint8Array>

export type AbcPublicKeyTweakAddFunction = (
  publicKey: Uint8Array,
  tweak: Uint8Array,
  compressed: boolean
) => Promise<Uint8Array>

export type AbcSecp256k1 = {
  publicKeyCreate: AbcPublicKeyCreateFunction,
  privateKeyTweakAdd: AbcPrivateKeyTweakAddFunction,
  publicKeyTweakAdd: AbcPublicKeyTweakAddFunction
}

export type AbcPbkdf2DeriveAsyncFunction = (
  key: Uint8Array,
  salt: Uint8Array,
  iter: number,
  len: number,
  algo: string
) => Promise<Uint8Array>

export type AbcPbkdf2 = {
  deriveAsync: AbcPbkdf2DeriveAsyncFunction
}

/**
 * Access to plaform-specific resources, with many optional fields.
 * The core will emulate/adapt whatever is missing.
 */
export type AbcRawIo = {
  // Crypto:
  +random: RandomFunction, // Non-optional & security-critical
  +scrypt?: AbcScryptFunction,
  +secp256k1?: AbcSecp256k1,
  +pbkdf2?: AbcPbkdf2,

  // Local io:
  +console?: AbcConsole,
  +folder?: DiskletFolder,
  +localStorage?: Storage,

  // Networking:
  +fetch: FetchFunction,
  +Socket?: net$Socket,
  +TLSSocket?: tls$TLSSocket,
  +WebSocket?: WebSocket
}

/**
 * Access to plaform-specific resources.
 * The core never talks to the outside world on its own,
 * but always goes through this object.
 */
export type AbcIo = {
  // Crypto:
  +random: RandomFunction,
  +scrypt: AbcScryptFunction,
  +secp256k1?: AbcSecp256k1,
  +pbkdf2?: AbcPbkdf2,

  // Local io:
  +console: AbcConsole,
  +folder: DiskletFolder,

  // Networking:
  +fetch: FetchFunction,
  +Socket?: net$Socket, // Still optional (no browser version)
  +TLSSocket?: tls$TLSSocket, // Still optional (no browser version)
  +WebSocket?: WebSocket // TODO: Make this non-optional
}

// context types ------------------------------------------------------

/* eslint-disable no-use-before-define */
export type AbcCorePlugin = AbcCurrencyPluginFactory | AbcExchangePluginFactory

export interface AbcCorePluginOptions {
  io: AbcIo;
}

export interface AbcContextCallbacks {
  +onError?: (e: Error) => void;
  +onExchangeUpdate?: () => void;
}

export type AbcContextOptions = {
  apiKey?: string,
  appId?: string,
  authServer?: string,
  callbacks?: AbcContextCallbacks,
  io?: AbcRawIo,
  plugins?: Array<AbcCorePlugin>,
  shapeshiftKey?: string
}

export type AbcMakeContextOpts = AbcContextOptions

export interface AbcContext {
  appId: string;
  io: AbcIo;

  // Local user management:
  fixUsername(username: string): string;
  listUsernames(): Promise<Array<string>>;
  deleteLocalAccount(username: string): Promise<void>;

  // Account creation:
  usernameAvailable(username: string): Promise<boolean>;
  createAccount(
    username: string,
    password?: string,
    pin?: string,
    opts?: AbcAccountOptions
  ): Promise<AbcAccount>;

  // Edge login:
  requestEdgeLogin(opts: AbcEdgeLoginOptions): Promise<AbcEdgeLoginRequest>;

  // Fingerprint login:
  loginWithKey(
    username: string,
    loginKey: string,
    opts?: AbcAccountOptions
  ): Promise<AbcAccount>;

  // Password login:
  checkPasswordRules(password: string): AbcPasswordRules;
  loginWithPassword(
    username: string,
    pin: string,
    opts?: AbcAccountOptions
  ): Promise<AbcAccount>;

  // PIN login:
  pinLoginEnabled(username: string): Promise<boolean>;
  loginWithPIN(
    username: string,
    pin: string,
    opts?: AbcAccountOptions
  ): Promise<AbcAccount>;

  // Recovery2 login:
  getRecovery2Key(username: string): Promise<string>;
  loginWithRecovery2(
    recovery2Key: string,
    username: string,
    answers: Array<string>,
    opts?: AbcAccountOptions
  ): Promise<AbcAccount>;
  fetchRecovery2Questions(
    recovery2Key: string,
    username: string
  ): Promise<Array<string>>;
  listRecoveryQuestionChoices(): Promise<Array<string>>;

  // Misc. stuff:
  getCurrencyPlugins(): Promise<Array<AbcCurrencyPlugin>>;

  // OTP stuff:
  requestOtpReset(username: string, otpResetToken: string): Promise<Date>;
  fetchLoginMessages(): Promise<AbcLoginMessages>;

  // Shapeshift:
  getExchangeSwapRate(
    fromCurrencyCode: string,
    toCurrencyCode: string
  ): Promise<number>;

  getExchangeSwapInfo(
    fromCurrencyCode: string,
    toCurrencyCode: string
  ): Promise<AbcExchangeSwapInfo>;
}

export type AbcExchangeSwapInfo = {
  rate: number,
  nativeMin: string,
  nativeMax: string
}

export interface AbcPasswordRules {
  secondsToCrack: number;
  tooShort: boolean;
  noNumber: boolean;
  noLowerCase: boolean;
  noUpperCase: boolean;
  passed: boolean;
}

export interface AbcEdgeLoginRequest {
  id: string;
  cancelRequest(): void;
}

export interface AbcEdgeLoginOptions extends AbcAccountOptions {
  displayImageUrl?: string;
  displayName?: string;
  onProcessLogin?: (username: string) => void;
  onLogin(e?: Error, account?: AbcAccount): void;
}

export type AbcLoginMessages = {
  [username: string]: {
    otpResetPending: boolean,
    recovery2Corrupt: boolean
  }
}

// account types ------------------------------------------------------

export type AbcWalletInfo = {
  id: string,
  type: string,
  keys: any
}

export type AbcWalletInfoFull = {
  appIds: Array<string>,
  archived: boolean,
  deleted: boolean,
  id: string,
  keys: any,
  sortIndex: number,
  type: string
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
  +onDataChanged?: () => void;
  +onKeyListChanged?: () => void;
  +onLoggedOut?: () => void;
  +onOtpDrift?: (drift: number) => void;
  +onRemoteOtpChange?: () => void;
  +onRemotePasswordChange?: () => void;

  // Currency wallet callbacks:
  +onAddressesChecked?: (walletId: string, progressRatio: number) => void;
  +onBalanceChanged?: (
    walletId: string,
    currencyCode: string,
    nativeBalance: string
  ) => void;
  +onBlockHeightChanged?: (walletId: string, blockHeight: number) => void;
  +onNewTransactions?: (
    walletId: string,
    abcTransactions: Array<AbcTransaction>
  ) => void;
  +onTransactionsChanged?: (
    walletId: string,
    abcTransactions: Array<AbcTransaction>
  ) => void;
  +onWalletDataChanged?: (walletId: string) => void;
  +onWalletNameChanged?: (walletId: string, name: string | null) => void;
}

export type AbcAccountOptions = {
  otp?: string,
  callbacks?: AbcAccountCallbacks
}

export interface AbcCreateCurrencyWalletOptions {
  name?: string;
  fiatCurrencyCode?: string;
  keys?: {};
}

export interface AbcAccount {
  // Basic login information:
  +appId: string;
  +loggedIn: boolean;
  +loginKey: string;
  +recoveryKey: string | void; // For email backup
  +username: string;

  // Exchange-rate info:
  +exchangeCache: any;

  // What login method was used?
  +edgeLogin: boolean;
  keyLogin: boolean;
  newAccount: boolean;
  passwordLogin: boolean;
  pinLogin: boolean;
  recoveryLogin: boolean;

  // Change or create credentials:
  changePassword(password: string): Promise<void>;
  changePin(opts: {
    pin?: string, // We keep the existing PIN if unspecified
    enableLogin?: boolean // We default to true if unspecified
  }): Promise<string>;
  changeRecovery(
    questions: Array<string>,
    answers: Array<string>
  ): Promise<string>;

  // Verify existing credentials:
  checkPassword(password: string): Promise<boolean>;
  checkPin(pin: string): Promise<boolean>;

  // Remove credentials:
  deletePassword(): Promise<void>;
  deletePin(): Promise<void>;
  deleteRecovery(): Promise<void>;

  // OTP:
  +otpKey: string | void; // OTP is enabled if this exists
  +otpResetDate: Date | void; // A reset is requested if this exists
  cancelOtpReset(): Promise<void>;
  disableOtp(): Promise<void>;
  enableOtp(timeout?: number): Promise<void>;

  // Edge login approval:
  fetchLobby(lobbyId: string): Promise<AbcLobby>;

  // Login management:
  logout(): Promise<void>;

  // Master wallet list:
  +allKeys: Array<AbcWalletInfoFull>;
  changeWalletStates(walletStates: AbcWalletStates): Promise<void>;
  createWallet(type: string, keys: any): Promise<string>;
  getFirstWalletInfo(type: string): ?AbcWalletInfo;
  getWalletInfo(id: string): AbcWalletInfo;
  listWalletIds(): Array<string>;

  // Currency wallets:
  +activeWalletIds: Array<string>;
  +archivedWalletIds: Array<string>;
  +currencyWallets: { [walletId: string]: AbcCurrencyWallet };
  createCurrencyWallet(
    type: string,
    opts?: AbcCreateCurrencyWalletOptions
  ): Promise<AbcCurrencyWallet>;

  // Deprecated stuff (will be deleted soon):
  +otpEnabled: boolean;
  cancelOtpResetRequest(): Promise<void>;
  changeKeyStates(walletStates: AbcWalletStates): Promise<void>;
  changePIN(password: string): Promise<void>;
  getFirstWallet(type: string): ?AbcWalletInfo;
  getWallet(id: string): AbcWalletInfo;
  isLoggedIn(): boolean;
  passwordOk(password: string): Promise<boolean>;
  passwordSetup(password: string): Promise<void>;
  pinSetup(password: string): Promise<void>;
  recovery2Set(
    questions: Array<string>,
    answers: Array<string>
  ): Promise<string>;
  setupRecovery2Questions(
    questions: Array<string>,
    answers: Array<string>
  ): Promise<string>;
}

// edge login types ---------------------------------------------------

export interface AbcLobby {
  loginRequest?: AbcLoginRequest;
  // walletRequest?: AbcWalletRequest
}

export interface AbcLoginRequest {
  appId: string;
  approve(): Promise<void>;

  displayName: string;
  displayImageUrl?: string;
}

// currency wallet types ----------------------------------------------

export type AbcCurrencyWallet = any

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
  nativeAmount?: string,
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
  metadata?: AbcMetadata,
  otherParams: any,
  wallet?: AbcCurrencyWallet
}

export type AbcDenomination = {
  name: string,
  multiplier: string,
  symbol?: string
}

export type AbcMetaToken = {
  currencyCode: string,
  currencyName: string,
  denominations: Array<AbcDenomination>,
  contractAddress?: string,
  symbolImage?: string
}

export type AbcCurrencyInfo = {
  // Basic currency information:
  currencyCode: string,
  currencyName: string,
  pluginName: string,
  denominations: Array<AbcDenomination>,
  walletTypes: Array<string>,

  // Configuration options:
  defaultSettings: any,
  metaTokens: Array<AbcMetaToken>,

  // Explorers:
  addressExplorer: string,
  blockExplorer?: string,
  transactionExplorer: string,

  // Images:
  symbolImage?: string,
  symbolImageDarkMono?: string
}

export type AbcParsedUri = {
  publicAddress?: string,
  segwitAddress?: string,
  nativeAmount?: string,
  currencyCode?: string,
  metadata?: AbcMetadata,
  bitIDURI?: string,
  bitIDDomain?: string,
  bitIDCallbackUri?: string,
  paymentProtocolUri?: string,
  returnUri?: string,
  bitidPaymentAddress?: string, // Experimental
  bitidKycProvider?: string, // Experimental
  bitidKycRequest?: string // Experimental
}

export type AbcEncodeUri = {
  publicAddress: string,
  segwitAddress?: string,
  nativeAmount?: string,
  label?: string,
  message?: string
}

export type AbcFreshAddress = {
  publicAddress: string,
  segwitAddress?: string
}

export type AbcDataDump = {
  walletId: string,
  walletType: string,
  pluginType: string,
  data: {
    [dataCache: string]: any
  }
}

export type AbcReceiveAddress = AbcFreshAddress & {
  metadata: AbcMetadata,
  nativeAmount: string
}

// currency plugin types ----------------------------------------------

export interface AbcCurrencyEngineCallbacks {
  +onBlockHeightChanged: (blockHeight: number) => void;
  +onTransactionsChanged: (abcTransactions: Array<AbcTransaction>) => void;
  +onBalanceChanged: (currencyCode: string, nativeBalance: string) => void;
  +onAddressesChecked: (progressRatio: number) => void;
  +onTxidsChanged: (txids: Array<string>) => void;
}

export interface AbcCurrencyEngineOptions {
  callbacks: AbcCurrencyEngineCallbacks;
  walletLocalFolder: any;
  walletLocalEncryptedFolder: any;
  optionalSettings?: any;
}

export interface AbcCurrencyEngine {
  updateSettings(settings: any): void;
  startEngine(): Promise<void>;
  killEngine(): Promise<void>;
  getBlockHeight(): number;
  enableTokens(tokens: Array<string>): Promise<void>;
  disableTokens(tokens: Array<string>): Promise<void>;
  getEnabledTokens(): Promise<Array<string>>;
  addCustomToken(token: any): Promise<void>;
  getTokenStatus(token: string): boolean;
  getBalance(options: any): string;
  getNumTransactions(options: any): number;
  getTransactions(options: any): Promise<Array<AbcTransaction>>;
  getFreshAddress(options: any): AbcFreshAddress;
  addGapLimitAddresses(addresses: Array<string>, options: any): void;
  isAddressUsed(address: string, options: any): boolean;
  makeSpend(abcSpendInfo: AbcSpendInfo): Promise<AbcTransaction>;
  signTx(abcTransaction: AbcTransaction): Promise<AbcTransaction>;
  broadcastTx(abcTransaction: AbcTransaction): Promise<AbcTransaction>;
  saveTx(abcTransaction: AbcTransaction): Promise<void>;
  resyncBlockchain(): Promise<void>;
  dumpData(): AbcDataDump;
  getDisplayPrivateSeed(): string | null;
  getDisplayPublicSeed(): string | null;
}

export interface AbcCurrencyPlugin {
  +pluginName: string;
  +currencyInfo: AbcCurrencyInfo;
  createPrivateKey(walletType: string): {};
  derivePublicKey(walletInfo: AbcWalletInfo): {};
  makeEngine(
    walletInfo: AbcWalletInfo,
    options: AbcMakeEngineOptions
  ): Promise<AbcCurrencyEngine>;
  parseUri(uri: string): AbcParsedUri;
  encodeUri(obj: AbcEncodeUri): string;
}

export interface AbcCurrencyPluginFactory {
  pluginType: 'currency';
  +pluginName: string;
  makePlugin(opts: AbcCorePluginOptions): Promise<AbcCurrencyPlugin>;
}

// Old names:
export type AbcMakeEngineOptions = AbcCurrencyEngineOptions
export type AbcCurrencyPluginCallbacks = AbcCurrencyEngineCallbacks

// exchange plugin types ----------------------------------------------

export interface AbcExchangePairHint {
  fromCurrency: string;
  toCurrency: string;
}

export interface AbcExchangePair {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
}

export interface AbcExchangePlugin {
  exchangeInfo: { exchangeName: string };

  fetchExchangeRates(
    pairHints: Array<AbcExchangePairHint>
  ): Array<AbcExchangePair>;
}

export interface AbcExchangePluginFactory {
  pluginType: 'exchange';
  makePlugin(opts: AbcCorePluginOptions): Promise<AbcExchangePlugin>;
}

// JSON API schemas ---------------------------------------------------

export const AbcEthFeesSchema = {
  type: 'object',
  additionalProperties: {
    type: 'object',
    properties: {
      gasLimit: {
        type: 'object',
        properties: {
          regularTransaction: { type: 'string' },
          tokenTransaction: { type: 'string' }
        },
        required: ['regularTransaction', 'tokenTransaction']
      },
      gasPrice: {
        type: 'object',
        properties: {
          lowFee: { type: 'string' },
          standardFeeLow: { type: 'string' },
          standardFeeHigh: { type: 'string' },
          standardFeeLowAmount: { type: 'string' },
          standardFeeHighAmount: { type: 'string' },
          highFee: { type: 'string' }
        },
        required: [
          'lowFee',
          'standardFeeLow',
          'standardFeeHigh',
          'standardFeeLowAmount',
          'standardFeeHighAmount',
          'highFee'
        ]
      }
    },
    required: ['gasLimit']
  }
}

export const AbcCurrencyInfoSchema = {
  type: 'object',
  properties: {
    walletTypes: {
      type: 'array',
      items: { type: 'string' }
    },
    currencyCode: { type: 'string' },
    currencyName: { type: 'string' },
    addressExplorer: { type: 'string' },
    transactionExplorer: { type: 'string' },
    denominations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          multiplier: { type: 'string' },
          symbol: { type: 'string' }
        },
        required: ['name', 'multiplier']
      }
    },
    symbolImage: { type: 'string' },
    metaTokens: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          currencyCode: { type: 'string' },
          currencyName: { type: 'string' },
          denominations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                multiplier: { type: 'string' },
                symbol: { type: 'string' }
              },
              required: ['name', 'multiplier']
            }
          },
          contractAddress: { type: 'string' },
          symbolImage: { type: 'string' }
        },
        required: ['currencyCode', 'currencyName', 'denominations']
      }
    }
  },
  required: [
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
