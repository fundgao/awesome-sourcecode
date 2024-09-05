const ImageMinimizerPlugin = require("image-minimizer-webpack-plugin");
const rspack = require("@rspack/core");

module.exports = {
  // devServer 关闭 HMR
  devServer: {
    hot: false,
    // 代理
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  entry: "index.js",
  output: {
    path: path.resolve(__dirname, "./dist"),
    filename: "index_bundle.js",
  },
  plugins: [
    new rspack.HtmlRspackPlugin(),
    process.env.RSDOCTOR &&
      new RsdoctorRspackPlugin({
        // 插件选项
      }),
    // 过滤 false 值 .filter(Boolean)
  ].filter(Boolean),
  optimization: {
    // 代码压缩
    minimizer: [
      new rspack.SwcJsMinimizerRspackPlugin({
        // JS minimizer 配置
      }),
      new rspack.LightningCssMinimizerRspackPlugin({
        // CSS minimizer 配置
      }),
    ],
  },
  module: {
    rules: [
      {
        test: /\.less$/,
        use: [
          {
            loader: "postcss-loader",
          },
          {
            loader: "less-loader",
          },
        ],
        type: "css",
      },
      {
        test: /\.png$/,
        use: [
          {
            // 使用 Optimizer Loader 进行优化图片
            loader: ImageMinimizerPlugin.loader,
            options: {
              // ...
            },
          },
          {
            loader: "builtin:lightningcss-loader",
            options: {
              targets: "ie 10",
            },
          },
          {
            // loader: "url-loader",
            // type: 'asset/inline' 替换 url-loader
            // type: 'asset/resource' 替换 file-loader
            // type: 'asset/source' 替换 raw-loader
          },
        ],
        type: "asset/inline",
      },
      // 对 ts 文件进行转译：
      {
        test: /\.ts$/,
        exclude: [/node_modules/],
        loader: "builtin:swc-loader",
        options: {
          jsc: {
            parser: {
              syntax: "typescript",
            },
          },
        },
        type: "javascript/auto",
      },
      // 对 jsx 文件进行转译
      {
        test: /\.jsx$/,
        use: {
          loader: "builtin:swc-loader",
          options: {
            jsc: {
              parser: {
                syntax: "ecmascript",
                jsx: true,
              },
              transform: {
                react: {
                  pragma: "React.createElement",
                  pragmaFrag: "React.Fragment",
                  throwIfNamespace: true,
                  development: false,
                  useBuiltins: false,
                },
              },
            },
          },
        },
        type: "javascript/auto",
      },
    ],
  },
};
