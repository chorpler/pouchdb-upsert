import buble from 'rollup-plugin-buble';
import replace from 'rollup-plugin-replace';
import typescript from 'rollup-plugin-typescript';

var external = Object.keys(require('../package.json').dependencies);

export default config => {
  return {
    input: 'src/index.ts',
    output: {
      format: config.format,
      file: config.dest
    },
    external: external,
    plugins: [
      typescript(),
      buble(),
      replace({'process.browser': JSON.stringify(!!config.browser)})
    ]
  };
};
