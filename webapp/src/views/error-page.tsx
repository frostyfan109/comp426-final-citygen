import { Button, Result } from 'antd'
import { navigate } from '@gatsbyjs/reach-router'
import { useMemo } from 'react'

interface ErrorPageProps {
    code: number
}

export const ErrorPage = ({ code }: ErrorPageProps) => {
    const subTitle = useMemo(() => {
        switch (code) {
            case 403:
                return "You are not authorized to access this page"
            case 404:
                return "The page you've visited does not exist"
            case 500:
            default:
                return "Something went wrong..."
        }
    }, [code])

    return (
        <div>
            <Result status="warning" title={ code } subTitle={ subTitle } extra={[
                <Button key={ 0 } type="text" onClick={ () => navigate("/") }>Go Home</Button>
            ]} />
        </div>
    )
} 