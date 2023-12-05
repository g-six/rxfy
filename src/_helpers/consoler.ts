export function consoler(...args: any[]) {
  console.log('* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *');
  if (args.length > 1) {
    const [filename] = args;
    if (typeof filename !== 'string' || !filename.includes('.ts')) throw 'Please provide filename when using console debugger for better DX';

    console.log('* File:', `src/${filename}`);
    args
      .slice(1)
      .filter(a => a !== undefined)
      .forEach(a => {
        if (typeof a === 'object' && a) {
          try {
            console.log(JSON.stringify(a, null, 4).split('\n').join('\n  '));
          } catch (e) {
            console.log(a);
          }
        } else if (typeof a === 'string') console.log(a.split('\n').join('\n  '));
        else console.log(a);
      });
    console.log('* End of debugging for:', filename);
    console.log('* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *');
    console.log('');
  }
}
