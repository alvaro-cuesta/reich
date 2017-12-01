const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

exports.basic = function(paths) {
  return {
    context: paths.app,
    output: {
      path: paths.build,
      filename: '[name].[hash].js',
      chunkFilename: '[chunkhash].js'
    },
    resolve: {
      modules: [paths.app, paths.lib, 'node_modules'],
    },
    devtool: process.env.WEBPACK_DEVTOOL
  };
};

exports.devServer = function(options) {
  return {
    devServer: {
      hot: true,
      inline: true,
      noInfo: true,
      host: options.host,
      port: options.port
    },
    plugins: [
      new webpack.HotModuleReplacementPlugin({
        multiStep: false  // HACK! Fixes html plugin https://github.com/jantimon/html-webpack-plugin/issues/533
      }),
      new webpack.NamedModulesPlugin(),
    ]
  };
};

exports.hotOnly = function(options) {
  const points = [
    'react-hot-loader/patch',
    `webpack-dev-server/client?http://${options.host || 'localhost'}:${options.port || 8080}`,
    'webpack/hot/only-dev-server'
  ];

  let entry;
  if (options.entry) {
    entry = {};
    entry[options.entry] = points;
  } else {
    entry = points;
  }

  return {
    entry,
    devServer: { inline: false }
  };
};

exports.clean = function(path) {
  return {
    plugins: [
      new CleanWebpackPlugin([path], {
        root: process.cwd()
      })
    ]
  };
};

const MINIFY_CONFIG = {
  minimize: true,
  screw_ie8 : true,
  mangle: {
    except: ['webpackJsonp'],
    screw_ie8 : true,
    keep_fnames: false,
  },
  output: {
    comments: false,
    screw_ie8 : true
  },
  compress: {
    sequences: true,
    properties: true,
    dead_code: true,
    drop_debugger: true,
    unsafe: false,
    unsafe_comps: false,
    conditionals: true,
    comparisons: true,
    evaluate: true,
    booleans: true,
    loops: true,
    unused: true,
    hoist_funs: true,
    hoist_vars: false,
    if_return: true,
    join_vars: true,
    cascade: true,
    collapse_vars: true,
    reduce_vars: true,
    warnings: false,
    negate_iife: true,
    pure_getters: true,
    pure_funcs: null,
    drop_console: false,
    keep_fargs: false,
    keep_fnames: false,
    screw_ie8 : true
  }
};

exports.minify = function() {
  return {
    plugins: [
      new webpack.optimize.UglifyJsPlugin(Object.assign(
        {},
        MINIFY_CONFIG,
        {
          exclude: [/vendor/, /manifest/],
          sourceMap: true,
        }
      )),
      new webpack.optimize.UglifyJsPlugin(Object.assign(
        {},
        MINIFY_CONFIG,
        {
          test: [/vendor/, /manifest/],
          sourceMap: false,
        }
      )),
      new webpack.optimize.OccurrenceOrderPlugin(false),
    ]
  };
};

exports.dontEmitIfErrors = function() {
  return {
    plugins: [
      new webpack.NoEmitOnErrorsPlugin()
    ]
  };
};

exports.productionEnv = function() {
  return {
    plugins: [
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: '"production"'
        }
      })
    ]
  };
};

exports.babelJSX = function() {
  return {
    resolve: { extensions: ['.js', '.jsx'] },
    module: {
      rules: [
        { test: /\.jsx?$/, exclude: /node_modules/, use: ['babel-loader?cacheDirectory'] }
      ]
    }
  };
};

exports.CSS = function() {
  return {
    resolve: { extensions: ['.css'] },
    module: {
      rules: [
        { test: /\.css$/, use: ['style-loader', 'css-loader?sourceMap'] },
      ]
    }
  };
};

exports.stylus = function() {
  return {
    resolve: { extensions: ['.styl'] },
    module: {
      rules: [
        { test: /\.styl$/, use: ['style-loader', 'css-loader?sourceMap', 'stylus-loader'] },
      ]
    }
  };
};

exports.extractStyles = function(options) {
  let appCSS = new ExtractTextPlugin('[name].[chunkhash].css');
  let vendorCSS = new ExtractTextPlugin('[name]-vendor.[chunkhash].css');

  let config = {
    resolve: { extensions: [] },
    module: { rules: [] },
    plugins: [appCSS, vendorCSS]
  };

  if (options.css !== false) {
    config.resolve.extensions.push('.css');

    config.module.rules.push(
      {
        test: /\.css$/,
        use: appCSS.extract(['css-loader?sourceMap']),
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: vendorCSS.extract(['css-loader']),
        include: /node_modules/
      }
    );
  }

  if (options.stylus) {
    config.resolve.extensions.push('.styl');

    config.module.rules.push(
      {
        test: /\.styl$/,
        use: appCSS.extract(['css-loader?sourceMap', 'stylus-loader']),
        exclude: /node_modules/
      },
      {
        test: /\.styl$/,
        use: vendorCSS.extract(['css-loader', 'stylus-loader']),
        include: /node_modules/
      }
    );
  }

  return config;
}

exports.productionSourceMap = function() {
  return {
    plugins: [
      new webpack.SourceMapDevToolPlugin({
        exclude: [/vendor/, /manifest/],
        filename: '[file].map',
        moduleFilenameTemplate: 'webpack:///[resource-path]',
        fallbackModuleFilenameTemplate: 'webpack:///[resourcePath]?[hash]',
        columns: true
      })
    ]
  }
}

exports.devSourceMap = function() {
  return { devtool: 'eval-source-map' };
}

exports.extractBundle = function(options) {
  const entry = {};
  entry[options.name] = options.entries;

  return {
    entry: entry,
    output: {filename: '[name].[chunkhash].js'},
    plugins: [
      new webpack.optimize.CommonsChunkPlugin({
        names: [options.name, 'manifest']
      })
    ]
  };
}

exports.extractVendor = function(additionalVendorModules) {
  additionalVendorModules = additionalVendorModules || []

  return exports.extractBundle({
    name: 'vendor',
    entries: Object.keys(require('./package.json').dependencies).concat(additionalVendorModules)
  });
}
