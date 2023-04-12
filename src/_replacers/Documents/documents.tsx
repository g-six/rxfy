'use client';
import React, { ReactElement, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
interface Props {
  nodeProps: any;
  nodes?: ReactElement[];
}
export default function DocumentsReplacer({ nodes }: Props) {
  useEffect(() => {
    axios
      .post(
        `/api/documents/${Cookies.get('cid')}`,
        {
          //   id: Cookies.get('cid'),
        },
        {
          headers: {
            Authorization: `Bearer ${Cookies.get('session_key')}`,
          },
        },
      )
      .then(res => {
        console.log(res);
      });
  }, []);
  return <div>{nodes}</div>;
}
