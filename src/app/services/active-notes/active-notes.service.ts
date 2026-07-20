import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {ActiveNotes} from '../../interfaces/active-notes';

@Injectable({
  providedIn: 'root'
})
export class ActiveNotesService {

  constructor(private httpClient: HttpClient) {
  }

  updateActiveNote(activeNote: ActiveNotes): Observable<any> {
    return this.httpClient.put<any>(environment.NOTES_PROFILING_URL + '/active-note/' + activeNote.id, activeNote);
  }

  saveActiveNote(activeNote: ActiveNotes): Observable<any> {
    return this.httpClient.post<any>(environment.NOTES_PROFILING_URL + '/active-note', activeNote);
  }

  getActiveNote(noteId: any): Observable<any> {
    return this.httpClient.get<any>(environment.NOTES_PROFILING_URL + '/active-note/' + noteId);
  }

  deleteActiveNote(noteId: any): Observable<any> {
    return this.httpClient.delete<any>(environment.NOTES_PROFILING_URL + '/active-note/' + noteId);
  }

  getNotes(params: string): Observable<any> {
    return this.httpClient.get(environment.NOTES_PROFILING_URL + '/active-note' + (params !== '' ? '?' + params : ''));
  }

  deleteShipmentNote(ShipmentID: string, NoteID: string, UserName: string): Observable<any> {
    return this.httpClient.get(environment.SHIPMENT_HISTORY_URL + '/notes/' + ShipmentID + '/' + NoteID + '/' + UserName);
  }
}
