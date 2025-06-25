import React, { useState, useEffect } from 'react';
import useAxios from '@/utils/useAxios';
import { jwtDecode } from "jwt-decode";

function Dashboard() {
    const [res, setRes] = useState("");
    const api = useAxios();

    let username = null;
    const token = localStorage.getItem("authTokens");

    if (token) {
        try {
            const decode = jwtDecode(token);
            username = decode.username;
        } catch (error) {
            console.error("Failed to decode token:", error);
            //logoutUser();
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get("/test/");
                setRes(response.data.message);
            } catch (error) {
                console.error("Error fetching GET data:", error);
                setRes("Algo salió mal [GET]");
            }
        };
        fetchData();
    }, [api]);


    // useEffect(() => {
    //     const fetchPostData = async () => {
    //         try {
    //             const response = await api.post("/test/", { text: "holaa" });
    //             setRes(response.data.message);
    //         } catch (error) {
    //             console.error("Error fetching POST data:", error);
    //             setRes("Algo salió mal [POST]");
    //         }
    //     };
    //     fetchPostData();
    // }, [api]);

    return (
        <div>
            <h1 className="h2">Dashboard</h1>
            <span>Jelouda {username || 'Guest'}!</span>
            <div className='alert alert-success'>
                <strong>{res}</strong>
            </div>
        </div>
    );
}

export default Dashboard;