export interface Node {
    address: string;
    location?: {
        lat: number;
        lng: number;
        country: string;
        city: string;
    }
    server_version?: string;
    version?: {
        major?: string;
        minor?: string;
        patch?: string;
        build?: string;
    };
    burn_block_height?: number;
    last_seen?: string;
}

export interface ApiResponse {
    network: string;
    nodes: Node[]
}
