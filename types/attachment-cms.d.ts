export declare class AttachmentCMS {
    private url;
    private token;
    private contents;
    constructor(token: string, baseUrl?: string);
    run(): Promise<void>;
    private fetchContents;
    private extractMatchedContents;
    private observeElement;
    private applyContents;
}
//# sourceMappingURL=attachment-cms.d.ts.map