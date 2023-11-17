/* eslint-disable react-hooks/exhaustive-deps */
import axios from 'axios';
import React, { useEffect, createElement, cloneElement } from 'react';

import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { TabContentProps } from '@/_typings/agent-my-listings';
import { getAutoGeneratedPropertyInfo } from '@/_utilities/api-calls/call-prompt';
import { searchByClasses, searchByPartOfClass } from '@/_utilities/rx-element-extractor';
import { ImagePreview } from '@/hooks/useFormEvent';

import Input from '@/_replacers/FilterFields/Input';
import SearchAddressCombobox from '@/_replacers/FilterFields/SearchAddressCombobox';
import RxDragNDrop from '@/components/RxDragNDrop';
import RxDropzone from '@/components/RxDropzone';
import useDebounce from '@/hooks/useDebounce';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { createPrivateListing, updatePrivateListing, uploadListingPhoto } from '@/_utilities/api-calls/call-private-listings';
import { PrivateListingInput, PrivateListingOutput } from '@/_typings/private-listing';

import styles from '@/components/RxButton.module.scss';

let btn_key = 1;
export default function TabAi({ template, nextStepClick, saveAndExit, data, fireEvent }: TabContentProps) {
  const [new_album_contents, setAlbumContents] = React.useState<string[]>();
  const [text_for_ai, setDescriptionForAi] = React.useState<string>('');
  const debouncedPrompt = useDebounce(text_for_ai, 900);
  const [photos_marked_for_deletion, markForDeletion] = React.useState([]);
  const [photos, setPhotos] = React.useState<ImagePreview[]>([]);
  const [is_uploading, toggleUploading] = React.useState<boolean>(false);

  if (data?.id) {
    if (data?.upload_queue && data?.photos && data.photos.filter(({ url }: { url: any }) => url).length === data?.upload_queue.total) {
      // Photo upload completed, update listing
      let photos: string[] = [];
      data.photos.forEach(({ url }: { url: any }) => {
        if (url) photos.push(url);
      });
    }
  }

  const checkPrompt = React.useCallback(
    (str: string) => {
      getAutoGeneratedPropertyInfo(str).then(res => fireEvent(res));
    },
    [fireEvent],
  );

  const generatePhotoArray = () => {
    setPhotos(
      data?.photos
        ? data.photos
            .filter((pht: string | ImagePreview) => pht)
            .map((image: unknown, idx: number) => {
              if (typeof image === 'string') return { url: image, preview: getImageSized(image, 140), lastModified: idx };
              else {
                const img = image as ImagePreview;
                if (!img.lastModified)
                  return {
                    ...img,
                    lastModified: idx,
                  };
              }
              return image;
            })
        : [],
    );
  };

  useEffect(() => {
    if (debouncedPrompt.length > 5) {
      checkPrompt(debouncedPrompt);
    }
    return () => {};
  }, [debouncedPrompt, checkPrompt]);

  useEffect(() => {
    if (new_album_contents && data) {
      setAlbumContents(undefined);
      updatePrivateListing(data.id, {
        photos: new_album_contents,
        property_photo_album: data?.property_photo_album?.id || undefined,
      }).then(() => {
        nextStepClick(undefined, {});
      });
    }
  }, [new_album_contents]);

  useEffect(() => {
    generatePhotoArray();
  }, [data.photos]);

  useEffect(() => {
    generatePhotoArray();
  }, []);

  useEffect(() => {
    generatePhotoArray();
  }, []);

  const blockNext = () => ![data?.title, data?.beds].every(Boolean);
  const reorderFiles = (newOrder: ImagePreview[]) => {
    fireEvent({ photos: [...newOrder] });
  };

  const savePhotos = async (rec: PrivateListingOutput) => {
    if (photos && rec.id) {
      if (!is_uploading) {
        toggleUploading(true);
        fireEvent({ id: rec.id });
        // Upload
        await Promise.all(
          photos.map(async (photo: File, cnt: number) => {
            if (photo.name) {
              const upload_item = await uploadListingPhoto(photo, cnt + 1, rec);
              const upl = await axios.put(upload_item.upload_url, photo, { headers: { 'Content-Type': photo.type } });
              photos[cnt] = {
                url: 'https://' + new URL(upload_item.upload_url).pathname.substring(1),
                preview: getImageSized('https://' + new URL(upload_item.upload_url).pathname.substring(1), 140),
                lastModified: cnt,
              } as unknown as ImagePreview;
            }
          }),
        );

        // Extract URL
        const urls = photos
          .map((pht: string | ImagePreview) => {
            if (typeof pht !== 'string') {
              return pht.url as string;
            }
            return pht;
          })
          .filter((pht: string) => pht);
        // Pass extrated url to update state of photo url array
        setAlbumContents(urls);

        toggleUploading(false);
      }
    } else {
      nextStepClick(undefined, {});
    }
  };

  const deleteFile = (id: number) => {
    // id is the index of the item in the array if it's not a newly added File
    // else id is timestamp (lastModified)
    markForDeletion(
      photos_marked_for_deletion.concat(
        data.photos.filter((preview: any, idx: number) => (typeof preview === 'object' ? preview.lastModified === id : id === idx)),
      ),
    );
    const photos = data?.photos
      ? data.photos.filter((preview: any, idx: number) => (typeof preview === 'object' ? preview.lastModified !== id : id !== idx))
      : [];
    fireEvent({ photos: photos });
  };

  let matches: tMatch[] = data?.id
    ? [
        {
          searchFn: searchByPartOfClass(['get-started']),
          transformChild: child => <></>,
        },
        {
          searchFn: searchByClasses(['modal-base', 'existing']),
          transformChild: child =>
            cloneElement(child, {
              ...child.props,
              className: child.props.className
                .split(' ')
                .filter((c: string) => c !== 'hidden-block')
                .join(' '),
            }),
        },
      ]
    : [
        {
          searchFn: searchByClasses(['modal-base', 'existing']),
          transformChild: child => <></>,
        },
      ];

  matches = matches.concat([
    {
      searchFn: searchByPartOfClass(['ai-prompt-input']),
      transformChild: child => (
        <Input
          template={child}
          value={text_for_ai || ''}
          inputProps={{ placeholder: child.props.placeholder }}
          onChange={e => setDescriptionForAi(e.currentTarget.value)}
        />
      ),
    },
    {
      searchFn: searchByPartOfClass(['address-input']),
      transformChild: child => (
        <SearchAddressCombobox
          defaultValue={data?.title}
          className={child.props.className}
          placeholder={child.props.placeholder}
          name='address'
          id='address-input'
          onPlaceSelected={place => fireEvent({ ...place, generatedAddress: place, title: place.address })}
          search={data?.generatedAddress?.address}
        />
      ),
    },
    {
      searchFn: searchByPartOfClass(['card-upload-wrapper']),
      transformChild: child => (
        <RxDropzone
          className={'card-upload-wrapper'}
          onFileUpload={(newFiles: ImagePreview[]) => {
            const photos = data?.photos ? data.photos : [];
            fireEvent({ photos: [...photos, ...newFiles] });
          }}
          inputId='agent_image'
        >
          {child.props.children}
        </RxDropzone>
      ),
    },
    {
      searchFn: searchByPartOfClass(['image-bank']),
      transformChild: child => {
        return photos && photos?.length > 0 ? <RxDragNDrop files={photos} template={child} reorderFiles={reorderFiles} deleteFile={deleteFile} /> : <></>;
      },
    },
    {
      searchFn: searchByPartOfClass(['f-button-neutral']),
      transformChild: child =>
        cloneElement(<button type='button' />, {
          className: `${child.props.className} disabled:bg-gray-500 disabled:cursor-not-allowed relative`,
          disabled: blockNext(),
          key: `${child.props.className}-${btn_key++}`,
          onClick: () => {
            const { id, title, description, baths, beds, dwelling_type, property_photo_album, lat, lon, area, city, state_province, postal_zip_code } = data;
            const input: unknown = {
              title,
              description,
              baths,
              beds,
              lat,
              lon,
              area,
              city,
              state_province,
              postal_zip_code,
            };

            // If photos were re-arranged or added, and we are editing an existing record (id is present)
            // update the private listing's photo album
            if (id && photos) {
              const new_files = photos.filter(({ url }: ImagePreview) => url).map(({ url }: ImagePreview) => url);
              savePhotos({
                id,
                title,
                photos: new_files,
                property_photo_album,
              } as unknown as PrivateListingOutput);
            } else createPrivateListing({ ...(input as PrivateListingInput), dwelling_type }).then(savePhotos);
          },
          children: (
            <>
              {is_uploading ? <span className={styles.loader} key={child.props.className} /> : ''}
              {child.props.children}
            </>
          ),
        }),
    },
    {
      searchFn: searchByPartOfClass(['f-button-secondary']),
      transformChild: child =>
        createElement(
          'button',
          {
            className: `${child.props.className} disabled:bg-gray-500 disabled:cursor-not-allowed`,
            disabled: blockNext(),
            onClick: () => saveAndExit(data),
          },
          [child.props.children],
        ),
    },
  ]);
  return <>{transformMatchingElements(template, matches)}</>;
}
