export const toDataURL = (url: string) =>
  fetch(url)
    .then(response => response.blob())
    .then(
      blob =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const arr = reader.result ? (reader.result as string) : '';
            const data = arr.split(',');
            const resp = {
              base64: reader.result,
              content: data[1],
              format: data[0].replace('data:image/', '').replace(';base64', ''),
              dataType: data[0].replace('data:', '').replace(';base64', ''),
            };
            resolve(resp);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        }),
    )
    .catch(err => {
      console.log('Caught error in _helpers/functions.toDataURL:', err);
    });

export const downloadFromUrl = (url: string, name: string = 'image', ext: string = 'png') => {
  let xhr = new XMLHttpRequest();
  xhr.responseType = 'blob';
  xhr.onload = function () {
    let a = document.createElement('a');
    a.href = window.URL.createObjectURL(xhr.response);
    a.download = name + '.' + ext;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  xhr.open('GET', url);
  xhr.send();
};

export const urlToFile = (image: string) => {
  return fetch(image)
    .then(response => response.blob())
    .then(blob => {
      const file = new File([blob], 'image.jpg', { type: blob.type });
      return { ...file, url: image, preview: image };
    });
};

export const fetchAsBlob = (url: string) => fetch(url).then(response => response.blob());

export const convertBlobToBase64 = (blob: Blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  });

export function applyBrightness(data: Uint8ClampedArray, brightness: number) {
  for (let i = 0; i < data.length; i += 4) {
    data[i] = data[i] > 0 ? brightness / data[i] : 0;
    data[i + 1] = data[i + 1] > 0 ? brightness / data[i + 1] : 0;
    data[i + 2] = data[i + 2] > 0 ? brightness / data[i + 2] : 0;
  }
  return data;
}

export function makeImageBlackAndWhite(data: Uint8ClampedArray) {
  let numberOfWhite = 0;
  let numberOfBlack = 0;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
    data[i] = gray > 55 ? 255 : 0; // Invert Red
    data[i + 1] = gray > 55 ? 255 : 0; // Invert Green
    data[i + 2] = gray > 55 ? 255 : 0; // Invert Blue
    numberOfWhite = numberOfWhite + (gray > 55 ? 1 : 0);
    numberOfBlack = numberOfBlack + (gray > 55 ? 0 : 1);
  }
  return numberOfWhite >= numberOfBlack;
}

export function invertImageColors(data: Uint8ClampedArray) {
  for (let i = 0; i < data.length; i += 4) {
    data[i] = data[i] ^ 255; // Invert Red
    data[i + 1] = data[i + 1] ^ 255; // Invert Green
    data[i + 2] = data[i + 2] ^ 255; // Invert Blue
  }
  return data;
}

export function convertImageDataToURI(imageData: ImageData, width: number, height: number) {
  return new Promise(resolve => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (context) {
      context.putImageData(imageData, 0, 0, 0, 0, width, height);
      setTimeout(() => resolve(canvas.toDataURL()), 100);
    } else {
      setTimeout(() => resolve(''), 100);
    }
  });
}

export function convertURIToImageData(URI: string) {
  return new Promise(function (resolve, reject) {
    if (!URI) return reject();
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const image = new Image();
    image.addEventListener('load', () => {
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      if (context) {
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const data = context.getImageData(0, 0, canvas.width, canvas.height);
        resolve({ imageData: data, width: canvas.width, height: canvas.height });
      } else {
        resolve({ imageData: null, width: 0, height: 0 });
      }
    });
    image.src = URI;
  });
}

export function invertImage(imgBase64: string, callback: (data: string) => any) {
  fetchAsBlob(imgBase64).then(blob => {
    convertBlobToBase64(blob).then(base64 => {
      convertURIToImageData(base64 as string).then(obj => {
        const { imageData, height, width } = obj as { imageData: ImageData; width: number; height: number };
        invertImageColors(imageData.data);
        convertImageDataToURI(imageData, width, height).then(res => callback(res as string));
      });
    });
  });
}
