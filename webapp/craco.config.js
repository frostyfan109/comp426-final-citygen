module.exports = {
    style: {
      postcss: {
        loaderOptions: (postcssLoaderOptions) => {
          postcssLoaderOptions.postcssOptions.plugins = [
            'postcss-flexbugs-fixes',
            [
              'postcss-preset-env',
              {
                autoprefixer: {
                  flexbox: 'no-2009',
                },
                stage: 3,
                features: {
                    'nesting-rules': true
                }
              },
            ],
          ]
  
          return postcssLoaderOptions
        },
      },
    },
  }