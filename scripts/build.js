const path = require('path');
const fs = require('fs');

const rimraf = require('rimraf');
const chalk = require('chalk');
const Browserify = require('browserify');
const UglifyJS = require('uglify-js');

function build() {
  const rootPath = path.join(__dirname, '../');
  // 使用 TypeScript 编译后的文件作为入口
  const inputFile = path.join(rootPath, 'dist/index.js');
  const outputPath = path.join(rootPath, 'dist');
  const outputJS = path.join(outputPath, 'baidubce-sdk.bundle.js');
  const outputMinJS = path.join(outputPath, 'baidubce-sdk.bundle.min.js');

  // 检查输入文件是否存在
  if (!fs.existsSync(inputFile)) {
    console.error(chalk.red.bold('[build] ❌ TypeScript 编译输出不存在，请先运行: npm run build:cjs'));
    process.exit(1);
  }

  console.log(chalk.green.bold(`[build] 📦 开始浏览器构建...`));

  // 只清理浏览器构建文件，保留 TypeScript 编译输出
  if (fs.existsSync(outputJS)) {
    fs.unlinkSync(outputJS);
  }
  if (fs.existsSync(outputMinJS)) {
    fs.unlinkSync(outputMinJS);
  }

  Browserify(inputFile, {standalone: 'baidubce.sdk'})
    .transform('babelify', {
      presets: ['@babel/preset-env'],
      plugins: [
        '@babel/plugin-transform-async-to-generator',
        ['@babel/plugin-syntax-optional-chaining-assign', {version: '2023-07'}],
        '@babel/plugin-transform-nullish-coalescing-operator'
      ]
    })
    .bundle()
    .pipe(fs.createWriteStream(outputJS))
    .on('finish', () => {
      if (fs.existsSync(outputJS)) {
        console.log(chalk.green.bold(`[build] ✨  built success ==> (${outputJS})`));
      }

      // 压缩代码
      const result = UglifyJS.minify(fs.readFileSync(outputJS, 'utf8'), {compress: true});

      if (result.error) {
        throw new Error(chalk.whiteBright.bgRed.bold('[build] UglifyJS failed. ', result.error));
      }

      fs.writeFileSync(outputMinJS, result.code, 'utf8');

      if (fs.existsSync(outputMinJS)) {
        console.log(chalk.green.bold(`[build] ✨  compressed success ==> (${outputMinJS})`));
      }
    });
}

build();
