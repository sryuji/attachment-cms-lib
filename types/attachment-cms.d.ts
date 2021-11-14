import { AttachmentConfigType } from './types/global';
export declare class AttachmentCMS {
    private baseUrl;
    private defaultToken;
    private queryToken;
    private contents;
    private id;
    private contentsResponse;
    private throttleApplyContents;
    constructor(options: AttachmentConfigType);
    get isClient(): boolean;
    get url(): string;
    get token(): string;
    run(): Promise<void>;
    private getQueryToken;
    private showLimitedMode;
    private fetchContents;
    private extractMatchedContents;
    private observeElement;
    private applyContents;
    private insertBeforeElement;
    private insertFirstChildToElement;
    private insertLastChildToElement;
    private insertAfterElement;
    private observeHistoryState;
}
//# sourceMappingURL=attachment-cms.d.ts.map