import ExtendableError from 'extendable-error'
import Vector from '../MapGenerator/src/ts/vector'

export interface IAPIError {
    status: number | null
}
export class APIError extends ExtendableError implements IAPIError {
    constructor(
        public status: number | null,
        public message: string
    ) {
        super(`${ status } - ${ message }`)
    }
}
export class APIRequestError extends APIError {
    constructor(
        private _fetchError: Error
    ) {
        super(
            null,
            "Encountered a network error"
        )
    }

    get fetchError() {
        return this._fetchError
    }

    get isAbort() {
        return this.fetchError.name === "AbortError"
    }
}
export class APIResponseError extends APIError {
    constructor(
        private _response: Response,
        private _data: any
    ) {
        super(_response.status, _data.message)
    }

    get response() {
        return this._response
    }

    get data() {
        return this._data
    }

    get detail() {
        return this.data.detail
    }

    static async fromResponse(response: Response): Promise<APIResponseError> {
        const data = await response.clone().json()
        return new APIResponseError(response, data)
    }
}

export interface UserPublic {
    username: string
}

export interface User extends UserPublic {
    id: number
    first_name: string
    last_name: string
    email: string
    is_active: boolean
    is_verified: boolean
    is_superuser: boolean
    created_at: string
}

export interface BuildingData {
    data: Vector[]
    height: number
}

export interface MapData {
    mainRoads: Vector[][]
    majorRoads: Vector[][]
    minorRoads: Vector[][]
    coastalRoads: Vector[][]
    bigParks: Vector[][]
    smallParks: Vector[][]
    buildings: BuildingData[]
    sea: Vector[]
    river: Vector[]
}

export interface Map {
    id: string
    name: string
    private: boolean
    data: MapData
    favorited: boolean
    created_at: string
    updated_at: string
    user?: User
}

interface OnUserChange {
    (user: User | null): void
}

interface OnAPIError {
    (error): void
}

export class API {
    private _apiUrl: string

    constructor(apiUrl: string, private _onUserChange?: OnUserChange, private _onApiError?: OnAPIError) {
        this.apiUrl = apiUrl
    }

    get apiUrl() {
        return this._apiUrl
    }

    set apiUrl(value: string) {
        this._apiUrl = value.endsWith("/") ? value : value + "/"
    }

    set onUserChange(value: OnUserChange | undefined) {
        this._onUserChange = value
    }

    set onApiError(value: OnAPIError | undefined) {
        this._onApiError = value
    }

    private async handleResponse(response: Response) {
        if (!response.ok) {
            const error = await APIResponseError.fromResponse(response)
            this._onApiError?.(error)
            throw error
        }
        const data = await response.text()
        if (data.length > 0) return JSON.parse(data)
        return data
    }

    private async makeRequest(
        method: string,
        endpoint: string,
        config: RequestInit={}
    ) {
        let res
        try {
            res = await fetch(`${ this.apiUrl}${ endpoint }`, {
                method,
                credentials: "include",
                ...config
            })
        } catch (e: any) {
            // console.log(12349134094810239,e.name)
            // throw e
            throw new APIRequestError(e)
        }
        return await this.handleResponse(res)
    }

    private async get(endpoint: string, config: RequestInit={}) {
        return await this.makeRequest("GET", endpoint, config)
    }

    private async post(endpoint: string, config: RequestInit={}) {
        return await this.makeRequest("POST", endpoint, config)
    }

    private async put(endpoint: string, config: RequestInit={}) {
        return await this.makeRequest("PUT", endpoint, config)
    }

    async login(
        email: string,
        password: string,
        { headers={}, ...config }: RequestInit={}
    ): Promise<User> {
        const user = await this.post("auth/login/", {
            ...config,
            headers: {
                ...headers,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                username: email,
                password,
                grant_type: "password"
            })
        })
        this._onUserChange?.(user)
        return user
    }

    async register(
        username: string,
        email: string,
        firstName: string,
        lastName: string,
        password: string,
        { headers={}, ...config }: RequestInit={}
    ): Promise<User> {
        const user = await this.post("auth/register/", {
            ...config,
            headers: {
                ...headers,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username,
                email,
                first_name: firstName,
                last_name: lastName,
                password
            })
        })
        this._onUserChange?.(user)
        return user
    }

    async logout(config: RequestInit={}): Promise<void> {
        await this.post("auth/logout/", config)
        this._onUserChange?.(null)
    }

    async changePassword(password: string, { headers={}, ...config }: RequestInit={}): Promise<void> {
        await this.post("auth/reset-password", {
            ...config,
            headers: {
                ...headers,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                password
            })
        })
    }

    async getUser(config: RequestInit={}): Promise<User> {
        return await this.get("users/self/", config)
    }

    async uploadUserAvatar(
        username: string,
        upload: File,
        config: RequestInit={}
    ): Promise<void> {
        const formData = new FormData()
        formData.append("file", upload)
        await this.put(`users/${ username }/avatar`, {
            ...config,
            body: formData
        })
    }

    async randomizeUserAvatar(
        username: string,
        config: RequestInit={}
    ): Promise<void> {
        await this.put(`users/${ username }/avatar/random`, config)
    }

    async getPublicMaps(config: RequestInit={}): Promise<Map[]> {
        return await this.get("maps/", config)
    }

    async getMyMaps(config: RequestInit={}): Promise<Map[]> {
        return await this.get("maps/self/", config)
    }

    async getMap(mapId: string, includeData: boolean=false, config: RequestInit={}): Promise<Map> {
        return await this.get(`maps/${ mapId }?include_data=${ includeData }`, config)
    }

    async createMap(
        name: string,
        thumbnailBase64: string,
        private_: boolean,
        data: MapData,
        { headers={}, ...config }: RequestInit={}
    ): Promise<Map> {
        return await this.post("maps/", {
            ...config,
            headers: {
                ...headers,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                thumbnail_base64: thumbnailBase64,
                private: private_,
                data
            })
        })
    }

    async setMapFavorited(
        mapId: string,
        favorited: boolean,
        { headers={}, ...config }: RequestInit={}
    ): Promise<void> {
        await this.post(`maps/${ mapId }/favorite`, {
            ...config,
            headers: {
                ...headers,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                favorited
            })
        })
    }
}