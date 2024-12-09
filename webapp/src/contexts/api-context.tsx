import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { API, APIError, APIResponseError, User } from '../api'

interface IAPIContext {
    loading: boolean
    user: User | null | undefined
    loggedIn: boolean | undefined
    api: API
}

interface APIProviderProps {
    children?: ReactNode
}

const APIContext = createContext<IAPIContext>({} as IAPIContext)

export const APIProvider = ({ children }: APIProviderProps) => {
    const [user, setUser] = useState<User|null|undefined>(undefined)

    const loggedIn = useMemo(() => user !== undefined ? !!user : undefined, [user])
    const loading = useMemo(() => loggedIn === undefined, [loggedIn])

    const onUserChange = useCallback((user: User | null) => {
        setUser(user)
    }, [])
    const onApiError = useCallback((error: APIError) => {
        if (error.status === 401) {
            setUser(null)
            document.cookie = ""
        }
    }, [])

    const api = useMemo(() => new API(
        process.env.REACT_APP_API_URL!
    ), [])

    useEffect(() => {
        api.onUserChange = onUserChange
    }, [api, onUserChange])
    
    useEffect(() => {
        api.onApiError = onApiError
    }, [api, onApiError])

    useEffect(() => {
        api.onUserChange = onUserChange
        api.onApiError = onApiError
        /** On mount, check if user credentials exist/valid and update user state. */
        void async function() {
            try {
                const user = await api.getUser()
                setUser(user)
            } catch (e: any) {
                // This will be done in onApiError most likely, but we should also proceed as
                // if the user is logged out if the request fails for any other reason as well.
                setUser(null)
                document.cookie = ""
            }
        }()
    }, [])

    return (
        <APIContext.Provider value={{
            loading,
            user,
            loggedIn,
            api
        }}>
            { children }
        </APIContext.Provider>
    )
}

export const useAPI = () => useContext(APIContext)