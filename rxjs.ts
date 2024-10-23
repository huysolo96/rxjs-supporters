import { combineLatest, fromEvent, of } from "rxjs";
import { filter } from "rxjs";
import { merge, Observable, Subject, throwError } from "rxjs";
import {
  catchError,
  finalize,
  map,
  startWith,
  switchMap,
  tap,
} from "rxjs/operators";
import { notErr, notNil, notNilObject } from "./util";
import { Pagination } from "./models";

/**
 * Given a subject, returns an operator that sets the subject to true when
 * the observable starts and false when the observable ends.
 * @param sbj The subject to notify.
 * @returns An operator that sets the subject to true when the observable starts and false when the observable ends.
 */
export const onLoading = (sbj: Subject<boolean>) => {
  return <U>(obs: Observable<U>) => {
    sbj.next(true);
    return obs.pipe(
      tap(() => sbj.next(true)),
      catchError((err) => {
        sbj.next(false);
        return throwError(() => err);
      }),
      finalize(() => {
        sbj.next(false);
      })
    );
  };
};

/**
 * Create an observable that emits true if the element is focused or false if it
 * is not focused. The observable starts with false.
 * @param el The element to watch focus.
 * @returns An observable that emits boolean values.
 */
export const watchFocus = (el: HTMLElement) => {
  return merge(
    fromEvent(el, "focusin").pipe(map(() => true)),
    fromEvent(el, "focusout").pipe(map(() => false))
  ).pipe(startWith(false));
};

export const filterNil = filter(notNil);

export const filterNilObject = filter(notNilObject);

export const filterTrue = filter<true>((value) => value === true);

export const filterFalse = filter<false>((value) => value === false);

/**
 * Catches errors in an observable stream and filters out any errors, emitting only non-error values.
 *
 * @template T - The type of items emitted by the observable.
 * @param {Observable<T>} obs - The observable to process.
 * @returns {Observable<T>} - An observable that emits only non-error values.
 */
export const filterError = <T>(obs: Observable<T>) =>
  obs.pipe(
    catchError((err) => of(new Error(err))),
    filter(notErr)
  );

/**
 * Combines reset and scroll observables to handle pagination.
 *
 * @param {Observable<T>} reset$ - The observable to reset the pagination.
 * @param {Observable<unknown>} scroll$ - The observable to trigger the next page.
 * @param {number | undefined} size - The size of each page. Defaults to paginationConfig.pageSize if not provided.
 * @return {Observable<T & PagingParams>} An observable that emits the current page and size along with the params from the reset observable.
 */
export const useScrolling = <T>(
  reset$: Observable<T>,
  scroll$: Observable<unknown>,
  size: number,
  startPage = 1
): Observable<T & Pagination> => {
  let page = startPage;
  return combineLatest([
    reset$.pipe(tap(() => (page = startPage))),
    scroll$,
  ]).pipe(
    map(([params]) => ({ page, size, ...params })),
    tap(() => page++)
  );
};

/**
 * Given a loadMore function, returns an operator that switches between the
 * observable and the loadMore observable. The loadMore observable is called
 * when the page is greater than 1 and the size is greater than 0. The data
 * from the loadMore observable is merged with the existing data.
 * @param {function(p: T & Pagination): Observable<D[]>} loadMoreFn The function to call when the page is greater than 1 and the size is greater than 0.
 * @param {boolean} [usePadNil] If true, pads the data with undefined values to the size of the page.
 * @returns {function(obs: Observable<T & PagingParams>): Observable<{ canLoadMore: boolean, data: (D | undefined)[] }>}
 */
export const switchLoadMore = <T, D>(
  loadMoreFn: (p: T & Pagination) => Observable<D[]>,
  usePadNil = true
) => {
  let defaultItems: (D | undefined)[] = [];
  let data: (D | undefined)[] = [];
  let prevPage = Infinity;
  return (obs: Observable<T & Pagination>) =>
    obs.pipe(
      tap((p) => {
        if (p.page <= prevPage) {
          if (usePadNil && p.size) {
            defaultItems = Array.from({ length: p.size }, () => undefined);
          } else {
            defaultItems = [];
          }
          data = defaultItems;
        }
        prevPage = p.page;
      }),
      filter((p) => {
        return !!p.size && data.length % p.size === 0;
      }),
      switchMap((v) => {
        return merge(
          of(data),
          loadMoreFn(v).pipe(
            map((res) => {
              data = [...data.filter(notNil), ...res];
              return data;
            })
          )
        ).pipe(catchError(() => of([])));
      })
    );
};
