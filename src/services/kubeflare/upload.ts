// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max'

/** 上传文件 POST /api/v1/upload/:type */
export async function uploadFile(
  type: string,
  body: FormData,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.UploadFileData>>(
    `/api/v1/upload/${type}`,
    {
      method: 'POST',
      data: body,
      ...(options || {}),
    },
  )
}
