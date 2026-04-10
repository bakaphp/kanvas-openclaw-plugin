import { KanvasClient } from "../../client/kanvas-client.js";
import type {
  CreateMessageInput,
  CreateMessageTypeInput,
  MessageWhereCondition,
  SendAnonymousEmailInput,
  UpdateMessageInput,
} from "./types.js";

export class SocialService {
  constructor(private readonly client: KanvasClient) {}

  async createMessage(input: CreateMessageInput) {
    const mutation = `
      mutation CreateMessage($input: MessageInput!) {
        createMessage(input: $input) {
          id
          uuid
          slug
          message
          is_public
          created_at
          parent {
            id
          }
          messageType {
            id
            name
            verb
          }
          channels {
            id
            slug
            name
            entity_id
            entity_namespace
          }
          appModuleMessage {
            entity_id
            system_modules
          }
          tags {
            data {
              id
              name
            }
          }
          custom_fields {
            name
            value
          }
        }
      }
    `;

    return this.client.query(mutation, {
      input: {
        message_verb: input.message_verb,
        message: input.message,
        parent_id: input.parent_id,
        entity_id: input.entity_id,
        channel_slug: input.channel_slug,
        is_public: input.is_public,
        tags: input.tags,
        custom_fields: input.custom_fields,
      },
    });
  }

  async getMessage(id: string) {
    const query = `
      query GetMessage($where: QueryMessagesWhereWhereConditions) {
        messages(first: 1, where: $where) {
          data {
            id
            uuid
            slug
            message
            is_public
            is_locked
            created_at
            updated_at
            parent {
              id
              uuid
            }
            user {
              id
              uuid
              firstname
              lastname
              displayname
            }
            messageType {
              id
              name
              verb
            }
            channels {
              id
              slug
              name
              entity_id
              entity_namespace
            }
            appModuleMessage {
              entity_id
              system_modules
            }
            files {
              data {
                id
                uuid
                name
                url
                type
              }
            }
            children(first: 50) {
              data {
                id
                uuid
                message
                created_at
                user {
                  id
                  displayname
                }
              }
            }
            tags {
              data {
                id
                name
              }
            }
            custom_fields {
              name
              value
            }
          }
        }
      }
    `;

    return this.client.query(query, {
      where: { column: "ID", operator: "EQ", value: id },
    });
  }

  async updateMessage(id: string, input: UpdateMessageInput) {
    const mutation = `
      mutation UpdateMessage($id: ID!, $input: MessageUpdateInput!) {
        updateMessage(id: $id, input: $input) {
          id
          uuid
          slug
          message
          is_public
          is_locked
          updated_at
          messageType {
            id
            name
            verb
          }
          tags {
            data {
              id
              name
            }
          }
          custom_fields {
            name
            value
          }
        }
      }
    `;

    return this.client.query(mutation, { id, input });
  }

  async deleteMessage(id: string) {
    const mutation = `
      mutation DeleteMessage($id: ID!) {
        deleteMessage(id: $id)
      }
    `;

    return this.client.query(mutation, { id });
  }

  async listChannelMessages(
    channelSlug: string,
    first = 25,
    page = 1,
    orderBy?: Array<{ column: string; order: string }>
  ) {
    const query = `
      query ChannelMessages(
        $channelSlug: String!
        $first: Int
        $page: Int
        $orderBy: [QueryChannelMessagesOrderByOrderByClause!]
      ) {
        channelMessages(
          channel_slug: $channelSlug
          first: $first
          page: $page
          orderBy: $orderBy
        ) {
          data {
            id
            uuid
            slug
            message
            is_public
            created_at
            user {
              id
              uuid
              displayname
            }
            messageType {
              id
              name
              verb
            }
            files {
              data {
                id
                uuid
                name
                url
                type
              }
            }
            children(first: 10) {
              data {
                id
                uuid
                message
                created_at
              }
            }
            tags {
              data {
                id
                name
              }
            }
          }
          paginatorInfo {
            currentPage
            lastPage
            total
          }
        }
      }
    `;

    return this.client.query(query, {
      channelSlug,
      first,
      page,
      orderBy: orderBy ?? [{ column: "CREATED_AT", order: "DESC" }],
    });
  }

  async searchMessages(
    search?: string,
    first = 25,
    hasType?: MessageWhereCondition,
    hasChannel?: MessageWhereCondition,
    hasAppModuleMessage?: MessageWhereCondition,
    where?: MessageWhereCondition
  ) {
    const query = `
      query SearchMessages(
        $first: Int
        $search: String
        $where: QueryMessagesWhereWhereConditions
        $hasType: QueryMessagesHasTypeWhereHasConditions
        $hasChannel: QueryMessagesHasChannelWhereHasConditions
        $hasAppModuleMessage: QueryMessagesHasAppModuleMessageWhereHasConditions
      ) {
        messages(
          first: $first
          search: $search
          where: $where
          hasType: $hasType
          hasChannel: $hasChannel
          hasAppModuleMessage: $hasAppModuleMessage
          orderBy: [{ column: CREATED_AT, order: DESC }]
        ) {
          data {
            id
            uuid
            slug
            message
            is_public
            created_at
            user {
              id
              uuid
              displayname
            }
            messageType {
              id
              name
              verb
            }
            channels {
              id
              slug
              name
              entity_id
              entity_namespace
            }
            appModuleMessage {
              entity_id
              system_modules
            }
            tags {
              data {
                id
                name
              }
            }
          }
          paginatorInfo {
            currentPage
            lastPage
            total
          }
        }
      }
    `;

    return this.client.query(query, {
      first,
      search,
      where,
      hasType,
      hasChannel,
      hasAppModuleMessage,
    });
  }

  async listMessageTypes(first = 50) {
    const query = `
      query MessageTypes($first: Int) {
        messageTypes(first: $first) {
          data {
            id
            uuid
            name
            verb
            template
            templates_plura
            created_at
          }
        }
      }
    `;

    return this.client.query(query, { first });
  }

  async createMessageType(input: CreateMessageTypeInput) {
    const mutation = `
      mutation CreateMessageType($input: CreateMessageTypeInput!) {
        createMessageType(input: $input) {
          id
          uuid
          name
          verb
          template
          templates_plura
          created_at
        }
      }
    `;

    return this.client.query(mutation, { input });
  }

  /**
   * Send an anonymous email using a notification template.
   * Requires xKanvasKey (uses @guardByAppKey auth).
   */
  async sendAnonymousEmail(input: SendAnonymousEmailInput) {
    const mutation = `
      mutation SendAnonymousEmail(
        $template_name: String!
        $data: Mixed!
        $email: Email!
        $subject: String!
        $attachment: [String]
      ) {
        sendNotificationAnonymousBaseOnTemplate(
          template_name: $template_name
          data: $data
          email: $email
          subject: $subject
          attachment: $attachment
        )
      }
    `;

    return this.client.queryWithAppKey(mutation, {
      template_name: input.template_name,
      data: input.data,
      email: input.email,
      subject: input.subject,
      attachment: input.attachment,
    });
  }
}
