import { KanvasClient } from "../../client/kanvas-client.js";
import type {
  CreateEventInput,
  EventFollowInput,
  UpdateEventInput,
} from "./types.js";

export class EventsService {
  constructor(private readonly client: KanvasClient) {}

  async listEvents(first = 25, search?: string, where?: Record<string, unknown>) {
    const query = `
      query ListEvents($first: Int, $search: String, $where: QueryEventsWhereWhereConditions) {
        events(first: $first, search: $search, where: $where) {
          data {
            id
            uuid
            name
            slug
            description
            created_at
            updated_at
            type { id name }
            eventStatus { id name }
            category { id name }
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
          paginatorInfo {
            currentPage
            lastPage
            total
          }
        }
      }
    `;

    return this.client.query(query, { first, search, where });
  }

  async getEvent(id: string) {
    const query = `
      query GetEvent($where: QueryEventsWhereWhereConditions) {
        events(first: 1, where: $where) {
          data {
            id
            uuid
            name
            slug
            description
            created_at
            updated_at
            type { id name }
            eventStatus { id name }
            category { id name }
            resources_id
            resources_type
            versions {
              data {
                id
                version
                start_at
                end_at
                max_capacity
                dates {
                  id
                  date
                  start_time
                  end_time
                }
              }
            }
            tags { id name }
            custom_fields { name value }
          }
        }
      }
    `;

    return this.client.query(query, {
      where: { column: "ID", operator: "EQ", value: id },
    });
  }

  async createEvent(input: CreateEventInput) {
    const mutation = `
      mutation CreateEvent($input: EventInput!) {
        createEvent(input: $input) {
          id
          uuid
          name
          slug
          description
          created_at
          type { id name }
          eventStatus { id name }
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

  async updateEvent(id: string, input: UpdateEventInput) {
    const mutation = `
      mutation UpdateEvent($id: ID!, $input: EventUpdateInput!) {
        updateEvent(id: $id, input: $input) {
          id
          uuid
          name
          description
          updated_at
          type { id name }
          eventStatus { id name }
        }
      }
    `;

    return this.client.query(mutation, { id, input });
  }

  async deleteEvent(id: string) {
    const mutation = `
      mutation DeleteEvent($id: ID!) {
        deleteEvent(id: $id)
      }
    `;

    return this.client.query(mutation, { id });
  }

  async followEvent(input: EventFollowInput) {
    const mutation = `
      mutation FollowEvent($input: FollowInput!) {
        followEvent(input: $input)
      }
    `;

    return this.client.query(mutation, { input });
  }

  async unFollowEvent(input: EventFollowInput) {
    const mutation = `
      mutation UnFollowEvent($input: FollowInput!) {
        unFollowEvent(input: $input)
      }
    `;

    return this.client.query(mutation, { input });
  }
}
