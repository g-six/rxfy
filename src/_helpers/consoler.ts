export function consoler(...args: any[]) {
  let output = '* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *\n';
  if (args.length > 1) {
    const [filename] = args;
    if (typeof filename !== 'string' || !filename.includes('.ts')) throw 'Please provide filename when using console debugger for better DX';

    output = `${output}* File: src/${filename}\n`;
    args
      .slice(1)
      .filter(a => a !== undefined)
      .forEach(a => {
        if (typeof a === 'object' && a) {
          try {
            output = `${output}${JSON.stringify(a, null, 4).split('\n').join('\n  ')}\n`;
          } catch (e) {
            output = `${output}${a}\n`;
          }
        } else if (typeof a === 'string') output = `${output} ${a.split('\n').join('\n  ')}\n`;
        else output = `${output}${a}\n`;
      });
    console.log(output, '* End of debugging for:', filename, '\n' + '* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *\n\n');
  }
}
