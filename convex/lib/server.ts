import { actionGeneric, internalActionGeneric, internalMutationGeneric, internalQueryGeneric, mutationGeneric, queryGeneric, type ActionBuilder, type DataModelFromSchemaDefinition, type DocumentByName, type GenericActionCtx, type GenericMutationCtx, type GenericQueryCtx, type MutationBuilder, type QueryBuilder, type TableNamesInDataModel } from 'convex/server';
import type { GenericId } from 'convex/values';
import type schema from '../schema';

// Schema-derived types keep local validation strict without needing a deployed project.
export type DataModel = DataModelFromSchemaDefinition<typeof schema>;
export type TableName = TableNamesInDataModel<DataModel>;
export type Doc<T extends TableName> = DocumentByName<DataModel, T>;
export type Id<T extends TableName> = GenericId<T>;
export type QueryCtx = GenericQueryCtx<DataModel>;
export type MutationCtx = GenericMutationCtx<DataModel>;
export type ActionCtx = GenericActionCtx<DataModel>;
export const query: QueryBuilder<DataModel, 'public'> = queryGeneric;
export const mutation: MutationBuilder<DataModel, 'public'> = mutationGeneric;
export const internalQuery: QueryBuilder<DataModel, 'internal'> = internalQueryGeneric;
export const internalMutation: MutationBuilder<DataModel, 'internal'> = internalMutationGeneric;
export const action: ActionBuilder<DataModel, 'public'> = actionGeneric;
export const internalAction: ActionBuilder<DataModel, 'internal'> = internalActionGeneric;
