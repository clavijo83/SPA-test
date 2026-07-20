export interface Note {
  notID: number | null;
  notTimeStamp: Date | null;
  notText: string | null;
  notCognitoUsername: string | null;
  clientNote: boolean | false;
  isNeedsManagement: boolean | false;
}
