

import { NextApiRequest, NextApiResponse } from 'next';

interface ResponseData {
  success: boolean;
  data?: any;
  message?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  if (req.method === 'POST') {
    const { userId, message } = req.body;

    const accessToken = process.env.ZALO_ACCESS_TOKEN;

    const url = `https://openapi.zalo.me/v2.0/oa/message`;

    const data = {
      recipient: {
        user_id: userId,
      },
      message: {
        text: message,
      },
    };

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    };

    try {
      const response = await fetch(url, options);
      const result = await response.json();

      if (response.ok) {
        res.status(200).json({ success: true, data: result });
      } else {
        res.status(500).json({ success: false, message: result.error.message });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal Server Error'});
    }
  } else {
    res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }
}
