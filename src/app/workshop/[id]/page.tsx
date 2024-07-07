import axios from "axios";
import Home from "./client_code";
import * as Interfaces from "@/app/interfaces";
import { headers } from 'next/headers'

const Main = async ({ params }: { params: { id: string } }) => {
    const headersList = headers()
    const cookie = headersList.get('Cookie');
    const userAgent = headersList.get('User-Agent');

    const initial_response = await axios.get(`/api/workshop/${params.id}`, {
        validateStatus: () => true, 
        withCredentials: true,
        headers: {
            "Cookie": cookie,
            "User-Agent": userAgent
        }});
    const data = initial_response.data.data as Interfaces.Bandage;
    return (
        <>  
            {data && 
                <>
                    <meta property="og:title" content={data.title} />
                    <meta property="og:description" content={data.description || 'Повязки Пепеленда для всех! Хотите себе на скин модную повязку Pepeland? Тогда вам сюда!'} />
                    <meta property="og:url" content={`https://pplbandage.ru/workshop/${data.external_id}`} />
                    <meta property="og:site_name" content="Повязки Pepeland" />
                    <meta property="og:image" content={`data:image/png;base64,${data.base64}`} />
                </>
            }
            <Home data={data} />
        </>
    )
}

export default Main;