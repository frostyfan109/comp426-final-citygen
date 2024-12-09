import { Spin } from 'antd'
import { Redirect } from '@gatsbyjs/reach-router'
import { useAPI } from '../contexts'

interface ProtectedRouteProps<T> {
    component: React.ComponentType<T>
    onlyRequireLoading?: boolean
    [key: string]: any
}

export const ProtectedRoute = ({ component: Component, onlyRequireLoading=false, ...props }: ProtectedRouteProps<any>) => {
    const { loading, loggedIn } = useAPI()
    
    if (loading) return <Spin />
    if (loggedIn || onlyRequireLoading) return <Component { ...props } />
    return <Redirect to="/login" noThrow />
}