import type { JoinPathPattern, Method, MethodOf, OperationParams, OperationResult, PathPattern, UrlParams } from '../../../definition/rest';
import type { IUser } from '../../../definition/IUser';

type SuccessResult<T> = {
	statusCode: 200;
	body:
	T extends object
		? { success: true } & T
		: T;
};

type FailureResult<T, TStack = undefined, TErrorType = undefined, TErrorDetails = undefined> = {
	statusCode: 400;
	body:
	T extends object
		? { success: false } & T
		: ({
			success: false;
			error: T;
			stack: TStack;
			errorType: TErrorType;
			details: TErrorDetails;
		}) & (
			undefined extends TErrorType
				? {}
				: { errorType: TErrorType }
		) & (
			undefined extends TErrorDetails
				? {}
				: { details: TErrorDetails extends string ? unknown : TErrorDetails }
		);
};

type UnauthorizedResult<T> = {
	statusCode: 403;
	body: {
		success: false;
		error: T | 'unauthorized';
	};
}

type Options = {
	permissionsRequired?: string[];
	twoFactorOptions?: unknown;
	twoFactorRequired?: boolean;
	authRequired?: boolean;
}

type ActionThis<TMethod extends Method, TPathPattern extends PathPattern, TOptions> = {
	urlParams: UrlParams<TPathPattern>;
	// TODO make it unsafe
	readonly queryParams: TMethod extends 'GET' ? Partial<OperationParams<TMethod, TPathPattern>> : Record<string, string>;
	// TODO make it unsafe
	readonly bodyParams: TMethod extends 'GET' ? Record<string, unknown> : Partial<OperationParams<TMethod, TPathPattern>>;
	requestParams(): OperationParams<TMethod, TPathPattern>;
	getPaginationItems(): {
		readonly offset: number;
		readonly count: number;
	};
	parseJsonQuery(): {
		sort: Record<string, unknown>;
		fields: Record<string, unknown>;
		query: Record<string, unknown>;
	};
	getUserFromParams(): IUser;
} & (
	TOptions extends { authRequired: true }
		? {
			readonly user: IUser;
			readonly userId: string;
		}
		: {
			readonly user: null;
			readonly userId: null;
		}
);

export type ResultFor<
	TMethod extends Method,
	TPathPattern extends PathPattern
> = SuccessResult<OperationResult<TMethod, TPathPattern>> | FailureResult<unknown, unknown, unknown, unknown> | UnauthorizedResult<unknown>;

type Action<TMethod extends Method, TPathPattern extends PathPattern, TOptions> =
	((this: ActionThis<TMethod, TPathPattern, TOptions>) => Promise<ResultFor<TMethod, TPathPattern>>)
	| ((this: ActionThis<TMethod, TPathPattern, TOptions>) => ResultFor<TMethod, TPathPattern>);

type Operation<TMethod extends Method, TPathPattern extends PathPattern, TEndpointOptions> = Action<TMethod, TPathPattern, TEndpointOptions> | {
	action: Action<TMethod, TPathPattern, TEndpointOptions>;
} & ({ twoFactorRequired: boolean });

type Operations<TPathPattern extends PathPattern, TOptions extends Options = {}> = {
	[M in MethodOf<TPathPattern> as Lowercase<M>]: Operation<Uppercase<M>, TPathPattern, TOptions>;
};

declare class APIClass<TBasePath extends string = '/'> {
	addRoute<
		TSubPathPattern extends string
	>(subpath: TSubPathPattern, operations: Operations<JoinPathPattern<TBasePath, TSubPathPattern>>): void;

	addRoute<
		TSubPathPattern extends string,
		TPathPattern extends JoinPathPattern<TBasePath, TSubPathPattern>
	>(subpaths: TSubPathPattern[], operations: Operations<TPathPattern>): void;

	addRoute<
		TSubPathPattern extends string,
		TOptions extends Options
	>(
		subpath: TSubPathPattern,
		options: TOptions,
		operations: Operations<JoinPathPattern<TBasePath, TSubPathPattern>, TOptions>
	): void;

	addRoute<
		TSubPathPattern extends string,
		TPathPattern extends JoinPathPattern<TBasePath, TSubPathPattern>,
		TOptions extends Options
	>(
		subpaths: TSubPathPattern[],
		options: TOptions,
		operations: Operations<TPathPattern, TOptions>
	): void;

	success<T>(result: T): SuccessResult<T>;

	success(): SuccessResult<void>;

	failure<
		T,
		TErrorType extends string,
		TStack extends string,
		TErrorDetails
	>(
		result: T,
		errorType?: TErrorType,
		stack?: TStack,
		error?: { details: TErrorDetails }
	): FailureResult<T, TErrorType, TStack, TErrorDetails>;

	failure<T>(result: T): FailureResult<T>;

	failure(): FailureResult<void>;

	unauthorized<T>(msg?: T): UnauthorizedResult<T>;

	defaultFieldsToExclude: {
		joinCode: 0;
		members: 0;
		importIds: 0;
		e2e: 0;
	}
}

export declare const API: {
	v1: APIClass<'/v1'>;
	default: APIClass;
};
