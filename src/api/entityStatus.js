import request from '@/utils/request.js'

export function getEntityStatus(){
    return request({
        url:'/api/states',
        method:'get'
    })
}