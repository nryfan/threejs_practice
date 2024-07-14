import {defineStore} from 'pinia';
export const useStatusStore=defineStore({
    id:'status',
    state:()=>{
        return {
            isCollapse:false
        }
    },
    actions:{
        setStatus(isCollapse){
            this.isCollapse=isCollapse
        }
    },
    getters:{
        getStatus(state){
            return state.isCollapse
        }
    },
})