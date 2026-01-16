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
        version?: string;
        commit_hash?: string;
        build_type?: string;
        platform?: string;
    };
    burn_block_height?: number;
    last_seen?: string;
    node_type?: string;
    connection_status?: "api" | "p2p_only" | "offline";
    stacker_db_count?: number;
}

export interface ApiResponse {
    network: string;
    nodes: Node[]
}
