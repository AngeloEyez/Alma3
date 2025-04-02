/* eslint-env node */

/*
 * This file runs in a Node context (it's NOT transpiled by Babel), so use only
 * the ES6 features that are supported by your Node version. https://node.green/
 */

// Configuration for your app
// https://v2.quasar.dev/quasar-cli-vite/quasar-config-js

const { configure } = require('quasar/wrappers');

module.exports = configure(function (/* ctx */) {
    return {
        eslint: {
            // fix: true,
            // include: [],
            // exclude: [],
            // rawOptions: {},
            warnings: true,
            errors: true
        },

        // https://v2.quasar.dev/quasar-cli/prefetch-feature
        // preFetch: true,

        // app boot file (/src/boot)
        // --> boot files are part of "main.js"
        // https://v2.quasar.dev/quasar-cli/boot-files
        boot: ['axios'],

        // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#css
        css: ['app.scss'],

        // https://github.com/quasarframework/quasar/tree/dev/extras
        extras: [
            // 'ionicons-v4',
            // 'mdi-v5',
            // 'fontawesome-v6',
            // 'eva-icons',
            // 'themify',
            // 'line-awesome',
            // 'roboto-font-latin-ext', // this or either 'roboto-font', NEVER both!

            'roboto-font', // optional, you are not bound to it
            'material-icons' // optional, you are not bound to it
        ],

        // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#build
        build: {
            target: {
                browser: ['es2019', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
                node: 'node16'
            },

            vueRouterMode: 'hash' // available values: 'hash', 'history'
            // vueRouterBase,
            // vueDevtools,
            // vueOptionsAPI: false,

            // rebuildCache: true, // rebuilds Vite/linter/etc cache on startup

            // publicPath: '/',
            // analyze: true,
            // env: {},
            // rawDefine: {}
            // ignorePublicFolder: true,
            // minify: false,
            // polyfillModulePreload: true,
            // distDir

            // extendViteConf (viteConf) {},
            // viteVuePluginOptions: {},

            // vitePlugins: [
            //   [ 'package-name', { ..options.. } ]
            // ]
        },

        // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#devServer
        devServer: {
            // https: true
            open: true // opens browser window automatically
        },

        // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#framework
        framework: {
            config: {},

            // iconSet: 'material-icons', // Quasar icon set
            // lang: 'en-US', // Quasar language pack

            // For special cases outside of where the auto-import strategy can have an impact
            // (like functional components as one of the examples),
            // you can manually specify Quasar components/directives to be available everywhere:
            //
            // components: [],
            // directives: [],

            // Quasar plugins
            plugins: ['Dialog', 'Notify']
        },

        // animations: 'all', // --- includes all animations
        // https://v2.quasar.dev/options/animations
        animations: [],

        // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#property-sourcefiles
        // sourceFiles: {
        //   rootComponent: 'src/App.vue',
        //   router: 'src/router/index',
        //   store: 'src/store/index',
        //   registerServiceWorker: 'src-pwa/register-service-worker',
        //   serviceWorker: 'src-pwa/custom-service-worker',
        //   pwaManifestFile: 'src-pwa/manifest.json',
        //   electronMain: 'src-electron/electron-main',
        //   electronPreload: 'src-electron/electron-preload'
        // },

        // https://v2.quasar.dev/quasar-cli/developing-ssr/configuring-ssr
        ssr: {
            // ssrPwaHtmlFilename: 'offline.html', // do NOT use index.html as name!
            // will mess up SSR

            // extendSSRWebserverConf (esbuildConf) {},
            // extendPackageJson (json) {},

            pwa: false,

            // manualStoreHydration: true,
            // manualPostHydrationTrigger: true,

            prodPort: 3000, // The default port that the production server should use
            // (gets superseded if process.env.PORT is specified at runtime)

            middlewares: [
                'render' // keep this as last one
            ]
        },

        // https://v2.quasar.dev/quasar-cli/developing-pwa/configuring-pwa
        pwa: {
            workboxMode: 'generateSW', // or 'injectManifest'
            injectPwaMetaTags: true,
            swFilename: 'sw.js',
            manifestFilename: 'manifest.json',
            useCredentialsForManifestTag: false
            // useFilenameHashes: true,
            // extendGenerateSWOptions (cfg) {}
            // extendInjectManifestOptions (cfg) {},
            // extendManifestJson (json) {}
            // extendPWACustomSWConf (esbuildConf) {}
        },

        // Full list of options: https://v2.quasar.dev/quasar-cli/developing-cordova-apps/configuring-cordova
        cordova: {
            // noIosLegacyBuildFlag: true, // uncomment only if you know what you are doing
        },

        // Full list of options: https://v2.quasar.dev/quasar-cli/developing-capacitor-apps/configuring-capacitor
        capacitor: {
            hideSplashscreen: true
        },

        // Full list of options: https://v2.quasar.dev/quasar-cli/developing-electron-apps/configuring-electron
        electron: {
            // extendElectronMainConf (esbuildConf)

            // extendElectronPreloadConf (esbuildConf)

            // specify the debugging port to use for the Electron app when running in development mode
            inspectPort: 5858,

            bundler: 'builder', // 'packager' or 'builder'

            packager: {
                // https://github.com/electron-userland/electron-packager/blob/master/docs/api.md#options
                // OS X / Mac App Store
                // appBundleId: '',
                // appCategoryType: '',
                // osxSign: '',
                // protocol: 'myapp://path',
                // Windows only
                // win32metadata: { ... }
            },

            builder: {
                // https://www.electron.build/configuration/configuration
                productName: 'Alma3',
                appId: 'alma3',
                win: {
                    target: [
                        {
                            target: 'portable', // "nsis" or "portable" 使用 NSIS 來打包為單個 exe 安裝檔案 , 或是使用 portable
                            arch: ['x64'] // 指定支援的架構
                        },
                        {
                            target: '7z', // "nsis" or "portable" 使用 NSIS 來打包為單個 exe 安裝檔案 , 或是使用 portable
                            arch: ['x64'] // 指定支援的架構
                        }
                    ]
                },
                nsis: {
                    oneClick: false, // 設置為 false 以支持多步驟安裝
                    perMachine: true,
                    allowElevation: true,
                    allowToChangeInstallationDirectory: true,
                    //installerIcon: 'src-electron/icons/icon.ico', // 替換為你的圖標路徑
                    //uninstallerIcon: 'src-electron/icons/icon.ico',
                    //installerHeaderIcon: 'src-electron/icons/icon.ico',
                    createDesktopShortcut: true,
                    createStartMenuShortcut: true,
                    shortcutName: 'Alma3' // 替換為你的應用程式名稱
                },
                // 添加 extraResources 將語言檔案嵌入
                extraResources: [
                    {
                        from: 'node_modules/@tesseract.js-data/eng/4.0.0/', //注意路徑後面的 / 表示複製該目錄下的所有內容。
                        to: 'tesseract-data'
                    }
                ]
            }
        },

        // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-browser-extensions/configuring-bex
        bex: {
            contentScripts: ['my-content-script']

            // extendBexScriptsConf (esbuildConf) {}
            // extendBexManifestJson (json) {}
        }
    };
});
