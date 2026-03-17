import { KanvasClient } from "../../client/kanvas-client.js";
import { postGraphQLMultipart } from "../../client/multipart.js";
import {
  AddLeadMessageByIdInput,
  CreateLeadAppointmentInput,
  CreateLeadInput,
  LeadFilesUploadInput,
  LeadFileUploadInput,
  LeadFollowInput,
  LeadMessageInput,
  LeadOutcomeStatus,
  LeadOwnerOrReceiverChangeInput,
  LeadParticipantInput,
  UpdateLeadInput,
} from "./types.js";

interface LeadChannelsResponse {
  leads?: {
    data?: Array<{
      channels?: Array<{ id: string; slug: string; name?: string }>;
    }>;
  };
}

interface GraphQLEnvelope<T> {
  data?: T;
  errors?: Array<{ message?: string }>;
}

interface CreateMessageResponse {
  createMessage: {
    id: string;
    uuid?: string;
    slug?: string;
    message?: string;
    created_at?: string;
    messageType?: { name?: string };
    channels?: Array<{ id: string; slug: string; name?: string }>;
  };
}

export class CrmService {
  constructor(private readonly client: KanvasClient) {}

  async searchLeads(search: string, first = 10) {
    const query = `
      query SearchLeads($first: Int, $search: String) {
        leads(first: $first, search: $search) {
          data {
            id
            uuid
            firstname
            lastname
            email
            phone
            created_at
            status { id name }
            type { id name }
            source { id name }
          }
        }
      }
    `;

    return this.client.query(query, { first, search });
  }

  async getLead(id: string) {
    const query = `
      query GetLead($first: Int!, $where: QueryLeadsWhereWhereConditions) {
        leads(first: $first, where: $where) {
          data {
            id
            uuid
            firstname
            lastname
            email
            phone
            description
            branch { id }
            people { id uuid firstname lastname }
            status { id name }
            stage { id name }
            pipeline { id name }
            owner { id uuid displayname }
            receiver { id name uuid }
            followers(first: 25) {
              data {
                id
                uuid
                displayname
              }
            }
            channel_files(includeParticipants: true, groupByAction: true) {
              total_groups
              groups {
                id
                uuid
                action
                verb
                status
                participant_name
                created_at
                last_message_at
                files {
                  id
                  name
                  url
                  file_type
                  size
                  verification_status
                  verification_message
                }
              }
            }
            channels {
              id
              name
              slug
              uuid
              entity_id
              entity_namespace
            }
            participants {
              people {
                id
                uuid
                name
              }
              relationship {
                id
                name
              }
            }
            events {
              id
              uuid
              name
              description
              created_at
              type { name }
              eventStatus { name }
              versions {
                data {
                  id
                  name
                  version_number
                  start_at
                  end_at
                  dates {
                    id
                    date
                    start_time
                    end_time
                  }
                }
              }
            }
            files {
              data {
                id
                uuid
                name
                url
                type
                created_at
              }
            }
          }
        }
      }
    `;

    return this.client.query(query, {
      first: 1,
      where: [{ column: "ID", operator: "EQ", value: id }],
    });
  }

  async createLead(input: CreateLeadInput) {
    const mutation = `
      mutation CreateLead($input: LeadInput!) {
        createLead(input: $input) {
          id
          uuid
          title
          firstname
          lastname
          email
          phone
          description
          branch { id }
          status { id name }
          type { id name }
          source { id name }
          pipeline { id name }
          stage { id name }
          people { id uuid firstname lastname }
          organization { name }
          created_at
        }
      }
    `;

    return this.client.query(mutation, { input });
  }

  async updateLead(id: string, input: UpdateLeadInput) {
    const mutation = `
      mutation UpdateLead($id: ID!, $input: LeadUpdateInput!) {
        updateLead(id: $id, input: $input) {
          id
          uuid
          title
          description
          status { id name }
          stage { id name }
          pipeline { id name }
          owner { id uuid displayname }
          receiver { id uuid name }
          updated_at
        }
      }
    `;

    return this.client.query(mutation, { id, input });
  }

  async changeLeadOwner(input: LeadOwnerOrReceiverChangeInput) {
    return this.updateLead(String(input.leadId), {
      branch_id: input.branch_id,
      people_id: input.people_id,
      title: input.title,
      description: input.description,
      leads_owner_id: input.leads_owner_id,
    });
  }

  async changeLeadReceiver(input: LeadOwnerOrReceiverChangeInput) {
    return this.updateLead(String(input.leadId), {
      branch_id: input.branch_id,
      people_id: input.people_id,
      title: input.title,
      description: input.description,
      receiver_id: input.receiver_id,
    });
  }

  async addLeadParticipant(input: LeadParticipantInput) {
    const mutation = `
      mutation AddLeadParticipant($input: LeadsParticipantsInput!) {
        addLeadParticipant(input: $input)
      }
    `;

    return this.client.query(mutation, { input });
  }

  async removeLeadParticipant(input: LeadParticipantInput) {
    const mutation = `
      mutation RemoveLeadParticipant($input: LeadsParticipantsInput!) {
        removeLeadParticipant(input: $input)
      }
    `;

    return this.client.query(mutation, { input });
  }

  async followLead(input: LeadFollowInput) {
    const mutation = `
      mutation FollowLead($input: FollowInput!) {
        followLead(input: $input)
      }
    `;

    return this.client.query(mutation, { input });
  }

  async unFollowLead(input: LeadFollowInput) {
    const mutation = `
      mutation UnFollowLead($input: FollowInput!) {
        unFollowLead(input: $input)
      }
    `;

    return this.client.query(mutation, { input });
  }

  async deleteLead(id: string) {
    const mutation = `
      mutation DeleteLead($id: ID!) {
        deleteLead(id: $id)
      }
    `;

    return this.client.query(mutation, { id });
  }

  async restoreLead(id: string) {
    const mutation = `
      mutation RestoreLead($id: ID!) {
        restoreLead(id: $id)
      }
    `;

    return this.client.query(mutation, { id });
  }

  async markLeadOutcome(id: string, status: LeadOutcomeStatus, reason_lost?: string) {
    const mutation = `
      mutation LeadWonOrLost($id: ID!, $status: LeadStatusEnum!, $reason_lost: String) {
        leadWonOrLost(id: $id, status: $status, reason_lost: $reason_lost) {
          id
          uuid
          title
          reason_lost
          status { id name }
          updated_at
        }
      }
    `;

    return this.client.query(mutation, { id, status, reason_lost });
  }

  async createLeadAppointment(input: CreateLeadAppointmentInput) {
    const mutation = `
      mutation CreateEvent($input: EventInput!) {
        createEvent(input: $input) {
          id
          uuid
          name
          description
          start_at
          end_at
          created_at
          resources {
            id
            resources_id
            resources_type
          }
          versions {
            data {
              id
              start_at
              end_at
              dates {
                id
                date
                start_time
                end_time
              }
            }
          }
        }
      }
    `;

    return this.client.query(mutation, { input });
  }

  async addLeadMessage(input: LeadMessageInput) {
    const mutation = `
      mutation CreateMessage($input: MessageInput!) {
        createMessage(input: $input) {
          id
          uuid
          slug
          message
          created_at
          messageType {
            name
          }
          channels {
            id
            slug
            name
          }
        }
      }
    `;

    return this.client.query(mutation, {
      input: {
        message: input.message,
        message_verb: "comment",
        channel_slug: input.channel_slug,
        parent_id: input.parent_id,
        is_public: input.is_public,
        custom_fields: input.custom_fields,
      },
    });
  }

  async addLeadMessageByLeadId(input: AddLeadMessageByIdInput) {
    const channelSlug = await this.getLeadPrimaryChannelSlug(String(input.leadId));

    if (!channelSlug) {
      throw new Error(`No lead channel found for lead ${input.leadId}`);
    }

    const created = await this.addLeadMessage({
      channel_slug: channelSlug,
      message: input.message,
      parent_id: input.parent_id,
      is_public: input.is_public,
      custom_fields: input.custom_fields,
    });

    if (!input.attachments?.length) {
      return created;
    }

    const messageId = (created as GraphQLEnvelope<CreateMessageResponse>).data?.createMessage?.id;
    if (!messageId) {
      throw new Error("Lead message created but message id was missing for attachment upload");
    }

    const attachmentResult = await this.attachFilesToMessage(messageId, input.attachments);

    return {
      ...created,
      attachments: attachmentResult,
    };
  }

  async listLeadMessages(channelSlug: string, first = 50, page = 1) {
    const query = `
      query LeadMessages($first: Int, $page: Int, $channelSlug: String!) {
        messages(
          first: $first
          page: $page
          orderBy: [{ column: CREATED_AT, order: DESC }]
          hasChannel: { column: SLUG, operator: EQ, value: $channelSlug }
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
              firstname
              lastname
              displayname
            }
            messageType {
              name
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
          }
        }
      }
    `;

    return this.client.query(query, { first, page, channelSlug });
  }

  async getLeadPrimaryChannelSlug(leadId: string) {
    const response = await this.client.query<LeadChannelsResponse>(
      `
        query LeadChannels($first: Int!, $where: QueryLeadsWhereWhereConditions) {
          leads(first: $first, where: $where) {
            data {
              channels {
                id
                slug
                name
              }
            }
          }
        }
      `,
      {
        first: 1,
        where: [{ column: "ID", operator: "EQ", value: leadId }],
      }
    );

    return response.data?.leads?.data?.[0]?.channels?.[0]?.slug ?? null;
  }

  async attachFileToLead(input: LeadFileUploadInput) {
    const query = `
      mutation AttachFileToLead($id: ID!, $file: Upload!, $params: Mixed) {
        attachFileToLead(id: $id, file: $file, params: $params) {
          id
          uuid
          title
          files {
            data {
              id
              uuid
              name
              url
              type
            }
          }
        }
      }
    `;

    return postGraphQLMultipart({
      config: this.client.getConfig(),
      query,
      variables: {
        id: input.leadId,
        file: null,
        params: input.params ?? null,
      },
      files: [
        {
          key: "variables.file",
          fileName: input.fileName,
          contentType: input.contentType,
          content: input.content,
        },
      ],
    });
  }

  async attachFilesToLead(input: LeadFilesUploadInput) {
    const query = `
      mutation AttachFilesToLead($id: ID!, $file: [Upload!]!, $params: Mixed) {
        attachFilesToLead(id: $id, file: $file, params: $params) {
          id
          uuid
          title
          files {
            data {
              id
              uuid
              name
              url
              type
            }
          }
        }
      }
    `;

    return postGraphQLMultipart({
      config: this.client.getConfig(),
      query,
      variables: {
        id: input.leadId,
        file: new Array(input.files.length).fill(null),
        params: input.params ?? null,
      },
      files: input.files.map((file, index) => ({
        key: `variables.file.${index}`,
        fileName: file.fileName,
        contentType: file.contentType,
        content: file.content,
      })),
    });
  }

  async attachFileToMessage(messageId: string | number, file: LeadFileUploadInput["content"], fileName: string, contentType?: string) {
    const query = `
      mutation AttachFileToMessage($message_id: ID!, $file: Upload!) {
        attachFileToMessage(message_id: $message_id, file: $file) {
          id
          uuid
          message
          files {
            data {
              id
              uuid
              name
              url
              type
            }
          }
        }
      }
    `;

    return postGraphQLMultipart({
      config: this.client.getConfig(),
      query,
      variables: {
        message_id: messageId,
        file: null,
      },
      files: [
        {
          key: "variables.file",
          fileName,
          contentType,
          content: file,
        },
      ],
    });
  }

  async attachFilesToMessage(messageId: string | number, files: LeadFilesUploadInput["files"]) {
    return Promise.all(
      files.map((file) =>
        this.attachFileToMessage(messageId, file.content, file.fileName, file.contentType)
      )
    );
  }

  async listLeadStatuses(first = 50) {
    const query = `
      query LeadStatuses($first: Int) {
        leadStatuses(first: $first) {
          data {
            id
            name
            is_default
          }
        }
      }
    `;

    return this.client.query(query, { first });
  }

  async listLeadSources(first = 50) {
    const query = `
      query LeadSources($first: Int) {
        leadSources(first: $first) {
          data {
            id
            name
          }
        }
      }
    `;

    return this.client.query(query, { first });
  }

  async listLeadTypes(first = 50) {
    const query = `
      query LeadTypes($first: Int) {
        leadTypes(first: $first) {
          data {
            id
            name
          }
        }
      }
    `;

    return this.client.query(query, { first });
  }

  async listPipelines(first = 50) {
    const query = `
      query Pipelines($first: Int) {
        pipelines(first: $first) {
          data {
            id
            name
            stages {
              id
              name
            }
          }
        }
      }
    `;

    return this.client.query(query, { first });
  }
}
