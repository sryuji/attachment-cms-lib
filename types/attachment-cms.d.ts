import { AttachmentConfigType } from './types/global';
export declare class AttachmentCMS {
    private url;
    private token;
    private contents;
    private id;
    private contentsResponse;
    constructor(options: AttachmentConfigType);
    run(): Promise<void>;
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