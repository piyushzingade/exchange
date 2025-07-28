import { BASE_URL } from "@/utils/httpClient"
import axios from "axios"



export default async function AllMarketLists() {
    const response  =  await axios.get(`${BASE_URL}/tickers`)
    const data = response.data
  return (
    <div className=''>
        {data.map((marker  : any) =>{
            <div className="">
                <div  className="">{marker.title}</div>
            </div>
        })}
    </div>
  )
}
