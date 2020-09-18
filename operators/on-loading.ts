import { Observable, Subject } from 'rxjs';
import {finalize} from 'rxjs/operators'
export const onLoading = (sbj: Subject<boolean>) => {
    return <U>(obs: Observable<U>) => {
        sbj.next(true);
        return obs.pipe(
            finalize(() => {
                sbj.next(false)
            })
        )
    }
}