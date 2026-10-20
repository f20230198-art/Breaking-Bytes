
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "admin_audit": {
                  Row: {
                    "action": string,"admin_id": string | null,"after": Json | null,"before": Json | null,"created_at": string,"id": number,"target_id": string | null,"target_table": string
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"admin_id"?: string | null,"after"?: Json | null,"before"?: Json | null,"created_at"?: string,"id"?: never,"target_id"?: string | null,"target_table": string
                  }
                  Update: {
                    "action"?: string,"admin_id"?: string | null,"after"?: Json | null,"before"?: Json | null,"created_at"?: string,"id"?: never,"target_id"?: string | null,"target_table"?: string
                  }
                  Relationships: [
                    
                  ]
                },"admin_emails": {
                  Row: {
                    "email": string
                  }
                  ComputedFields: never
                  Insert: {
                    "email": string
                  }
                  Update: {
                    "email"?: string
                  }
                  Relationships: [
                    
                  ]
                },"announcements": {
                  Row: {
                    "body": string,"created_at": string,"id": string,"pinned": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"created_at"?: string,"id"?: string,"pinned"?: boolean
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"id"?: string,"pinned"?: boolean
                  }
                  Relationships: [
                    
                  ]
                },"event_config": {
                  Row: {
                    "deadline_at": string | null,"id": number,"prize_pool_aed": number | null,"problems_release_at": string | null,"registration_open": boolean,"roster_lock_at": string | null,"starts_at": string | null,"submissions_open_at": string | null,"supplier_cap_slack": number,"supplier_pick_at": string | null,"team_max": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "deadline_at"?: string | null,"id"?: number,"prize_pool_aed"?: number | null,"problems_release_at"?: string | null,"registration_open"?: boolean,"roster_lock_at"?: string | null,"starts_at"?: string | null,"submissions_open_at"?: string | null,"supplier_cap_slack"?: number,"supplier_pick_at"?: string | null,"team_max"?: number,"updated_at"?: string
                  }
                  Update: {
                    "deadline_at"?: string | null,"id"?: number,"prize_pool_aed"?: number | null,"problems_release_at"?: string | null,"registration_open"?: boolean,"roster_lock_at"?: string | null,"starts_at"?: string | null,"submissions_open_at"?: string | null,"supplier_cap_slack"?: number,"supplier_pick_at"?: string | null,"team_max"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"faqs": {
                  Row: {
                    "a": string,"id": string,"q": string,"sort_order": number,"visible": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "a": string,"id"?: string,"q": string,"sort_order"?: number,"visible"?: boolean
                  }
                  Update: {
                    "a"?: string,"id"?: string,"q"?: string,"sort_order"?: number,"visible"?: boolean
                  }
                  Relationships: [
                    
                  ]
                },"join_attempts": {
                  Row: {
                    "at": string,"ok": boolean,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "at"?: string,"ok": boolean,"user_id": string
                  }
                  Update: {
                    "at"?: string,"ok"?: boolean,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"partner_universities": {
                  Row: {
                    "active": boolean,"domain_pattern": string,"id": string,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"domain_pattern": string,"id"?: string,"name": string
                  }
                  Update: {
                    "active"?: boolean,"domain_pattern"?: string,"id"?: string,"name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"prizes": {
                  Row: {
                    "amount_aed": number | null,"awarded_team_id": string | null,"category_only": Database["public"]['Enums']["category"] | null,"id": string,"kind": Database["public"]['Enums']["prize_kind"],"name": string,"perk_description": string | null,"rank": number,"ratio": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_aed"?: number | null,"awarded_team_id"?: string | null,"category_only"?: Database["public"]['Enums']["category"] | null,"id"?: string,"kind"?: Database["public"]['Enums']["prize_kind"],"name": string,"perk_description"?: string | null,"rank": number,"ratio"?: number | null
                  }
                  Update: {
                    "amount_aed"?: number | null,"awarded_team_id"?: string | null,"category_only"?: Database["public"]['Enums']["category"] | null,"id"?: string,"kind"?: Database["public"]['Enums']["prize_kind"],"name"?: string,"perk_description"?: string | null,"rank"?: number,"ratio"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "prizes_awarded_team_id_fkey"
      columns: ["awarded_team_id"]
isOneToOne: false
      referencedRelation: "teams"
      referencedColumns: ["id"]
    }
                  ]
                },"problems": {
                  Row: {
                    "body_md": string,"capacity": number | null,"created_at": string,"criteria_md": string,"id": string,"is_published": boolean,"sponsor_id": string,"summary": string,"title": string,"track": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "body_md"?: string,"capacity"?: number | null,"created_at"?: string,"criteria_md"?: string,"id": string,"is_published"?: boolean,"sponsor_id": string,"summary"?: string,"title": string,"track"?: string | null
                  }
                  Update: {
                    "body_md"?: string,"capacity"?: number | null,"created_at"?: string,"criteria_md"?: string,"id"?: string,"is_published"?: boolean,"sponsor_id"?: string,"summary"?: string,"title"?: string,"track"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "problems_sponsor_id_fkey"
      columns: ["sponsor_id"]
isOneToOne: false
      referencedRelation: "sponsors"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "avatar_url": string | null,"banned": boolean,"category": Database["public"]['Enums']["category"],"category_override": boolean,"created_at": string,"display_name": string,"email": string,"id": string,"onboarded": boolean,"phone": string | null,"role": Database["public"]['Enums']["user_role"],"university_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_url"?: string | null,"banned"?: boolean,"category"?: Database["public"]['Enums']["category"],"category_override"?: boolean,"created_at"?: string,"display_name"?: string,"email": string,"id": string,"onboarded"?: boolean,"phone"?: string | null,"role"?: Database["public"]['Enums']["user_role"],"university_id"?: string | null
                  }
                  Update: {
                    "avatar_url"?: string | null,"banned"?: boolean,"category"?: Database["public"]['Enums']["category"],"category_override"?: boolean,"created_at"?: string,"display_name"?: string,"email"?: string,"id"?: string,"onboarded"?: boolean,"phone"?: string | null,"role"?: Database["public"]['Enums']["user_role"],"university_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "profiles_university_id_fkey"
      columns: ["university_id"]
isOneToOne: false
      referencedRelation: "partner_universities"
      referencedColumns: ["id"]
    }
                  ]
                },"schedule_items": {
                  Row: {
                    "day_offset": number,"detail": string,"end_label": string | null,"id": string,"sort_order": number,"time_label": string,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "day_offset"?: number,"detail"?: string,"end_label"?: string | null,"id"?: string,"sort_order"?: number,"time_label": string,"title": string
                  }
                  Update: {
                    "day_offset"?: number,"detail"?: string,"end_label"?: string | null,"id"?: string,"sort_order"?: number,"time_label"?: string,"title"?: string
                  }
                  Relationships: [
                    
                  ]
                },"sponsors": {
                  Row: {
                    "created_at": string,"id": string,"is_supplier": boolean,"logo_path": string | null,"name": string,"sort_order": number,"symbol": string | null,"tier": Database["public"]['Enums']["sponsor_tier"],"visible": boolean,"website": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"is_supplier"?: boolean,"logo_path"?: string | null,"name": string,"sort_order"?: number,"symbol"?: string | null,"tier"?: Database["public"]['Enums']["sponsor_tier"],"visible"?: boolean,"website"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"is_supplier"?: boolean,"logo_path"?: string | null,"name"?: string,"sort_order"?: number,"symbol"?: string | null,"tier"?: Database["public"]['Enums']["sponsor_tier"],"visible"?: boolean,"website"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"submissions": {
                  Row: {
                    "live_url": string | null,"notes": string,"repo_url": string | null,"team_id": string,"updated_at": string,"updated_by": string | null,"video_url": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "live_url"?: string | null,"notes"?: string,"repo_url"?: string | null,"team_id": string,"updated_at"?: string,"updated_by"?: string | null,"video_url"?: string | null
                  }
                  Update: {
                    "live_url"?: string | null,"notes"?: string,"repo_url"?: string | null,"team_id"?: string,"updated_at"?: string,"updated_by"?: string | null,"video_url"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "submissions_team_id_fkey"
      columns: ["team_id"]
isOneToOne: true
      referencedRelation: "teams"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "submissions_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"team_members": {
                  Row: {
                    "joined_at": string,"team_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "joined_at"?: string,"team_id": string,"user_id": string
                  }
                  Update: {
                    "joined_at"?: string,"team_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "team_members_team_id_fkey"
      columns: ["team_id"]
isOneToOne: false
      referencedRelation: "teams"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "team_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"teams": {
                  Row: {
                    "created_at": string,"id": string,"invite_code": string,"leader_id": string | null,"name": string,"problem_id": string | null,"roster_locked": boolean,"sponsor_id": string | null,"status": Database["public"]['Enums']["team_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"invite_code": string,"leader_id"?: string | null,"name": string,"problem_id"?: string | null,"roster_locked"?: boolean,"sponsor_id"?: string | null,"status"?: Database["public"]['Enums']["team_status"]
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"invite_code"?: string,"leader_id"?: string | null,"name"?: string,"problem_id"?: string | null,"roster_locked"?: boolean,"sponsor_id"?: string | null,"status"?: Database["public"]['Enums']["team_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "teams_leader_id_fkey"
      columns: ["leader_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "teams_problem_id_fkey"
      columns: ["problem_id"]
isOneToOne: false
      referencedRelation: "problems"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "teams_sponsor_id_fkey"
      columns: ["sponsor_id"]
isOneToOne: false
      referencedRelation: "sponsors"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "prize_board": {
                  Row: {
                    "amount_aed": number | null,"awarded_team_id": string | null,"category_only": Database["public"]['Enums']["category"] | null,"id": string | null,"kind": Database["public"]['Enums']["prize_kind"] | null,"name": string | null,"perk_description": string | null,"rank": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "prizes_awarded_team_id_fkey"
      columns: ["awarded_team_id"]
isOneToOne: false
      referencedRelation: "teams"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "_audit":
{ Args: { "p_action": string,"p_after": Json,"p_before": Json,"p_id": string,"p_table": string }; Returns: undefined
                           },
"_cfg":
{ Args: Record<PropertyKey, never>; Returns: {
              "deadline_at": string | null,
"id": number,
"prize_pool_aed": number | null,
"problems_release_at": string | null,
"registration_open": boolean,
"roster_lock_at": string | null,
"starts_at": string | null,
"submissions_open_at": string | null,
"supplier_cap_slack": number,
"supplier_pick_at": string | null,
"team_max": number,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "event_config"
        isOneToOne: true
        isSetofReturn: false
      } },
"_me":
{ Args: Record<PropertyKey, never>; Returns: {
              "avatar_url": string | null,
"banned": boolean,
"category": Database["public"]['Enums']["category"],
"category_override": boolean,
"created_at": string,
"display_name": string,
"email": string,
"id": string,
"onboarded": boolean,
"phone": string | null,
"role": Database["public"]['Enums']["user_role"],
"university_id": string | null
            }
                          SetofOptions: {
        from: "*"
        to: "profiles"
        isOneToOne: true
        isSetofReturn: false
      } },
"_my_team":
{ Args: { "p_leader": boolean }; Returns: {
              "created_at": string,
"id": string,
"invite_code": string,
"leader_id": string | null,
"name": string,
"problem_id": string | null,
"roster_locked": boolean,
"sponsor_id": string | null,
"status": Database["public"]['Enums']["team_status"]
            }
                          SetofOptions: {
        from: "*"
        to: "teams"
        isOneToOne: true
        isSetofReturn: false
      } },
"_new_invite_code":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"_roster_open":
{ Args: { "p_lock": string }; Returns: boolean
                           },
"_supplier_cap":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"admin_crews":
{ Args: Record<PropertyKey, never>; Returns: {
              "category": Database["public"]['Enums']["category"],"id": string,"invite_code": string,"late": boolean,"live_url": string,"members": Json,"name": string,"notes": string,"problem_id": string,"repo_url": string,"roster_locked": boolean,"sponsor": string,"status": Database["public"]['Enums']["team_status"],"submitted_at": string,"video_url": string
            }[]
                           },
"admin_overview":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"create_team":
{ Args: { "p_name": string }; Returns: string
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"join_team":
{ Args: { "p_code": string }; Returns: string
                           },
"leave_team":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"lock_problem":
{ Args: { "p_problem": string }; Returns: undefined
                           },
"my_crew":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"my_team_id":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"pick_supplier":
{ Args: { "p_sponsor": string }; Returns: undefined
                           },
"remove_member":
{ Args: { "p_user": string }; Returns: undefined
                           },
"server_time":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"set_roster_locked":
{ Args: { "p_locked": boolean }; Returns: undefined
                           },
"supplier_slots":
{ Args: Record<PropertyKey, never>; Returns: {
              "cap": number,"logo_path": string,"name": string,"sponsor_id": string,"symbol": string,"taken": number
            }[]
                           },
"team_category":
{ Args: { "p_team": string }; Returns: Database["public"]['Enums']["category"]
                           },
"university_for":
{ Args: { "p_email": string }; Returns: string
                           },
"update_profile":
{ Args: { "p_display_name": string,"p_phone"?: string }; Returns: undefined
                           },
"upsert_submission":
{ Args: { "p_live": string,"p_notes"?: string,"p_repo": string,"p_video": string }; Returns: string
                           }
          }
          Enums: {
            "category": "walter"|"jesse","prize_kind": "cash"|"perk","sponsor_tier": "title"|"track"|"food"|"perk","team_status": "active"|"disqualified","user_role": "hacker"|"admin"|"judge"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "category": ["walter", "jesse"],"prize_kind": ["cash", "perk"],"sponsor_tier": ["title", "track", "food", "perk"],"team_status": ["active", "disqualified"],"user_role": ["hacker", "admin", "judge"]
          }
        }
} as const
