"use client";
import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { cn } from "@lib/utils";
import debounce from "lodash.debounce";
import { useTranslation } from "@i18n/client";
import { useSearchParams } from "next/navigation";
import { Language, LocalizedFormProperties } from "@lib/types/form-builder-types";
import { ElementPanel } from ".";
import { ConfirmationDescriptionWithGroups } from "./ConfirmationDescriptionWithGroups";
import { RichTextLockedWithGroups } from "./elements/RichTextLockedWithGroups";
import { ExpandingInput } from "@formBuilder/components/shared";
import { useRehydrate, useTemplateStore } from "@lib/store/useTemplateStore";
import { SettingsPanel } from "./settings/SettingsPanel";
import { cleanInput } from "@lib/utils/form-builder";
import { SaveButton } from "@formBuilder/components/shared/SaveButton";
import { useGroupStore } from "@formBuilder/components/shared/right-panel/treeview/store/useGroupStore";
import { Section } from "./Section";
import { FormElement } from "@lib/types";
import { LangSwitcher } from "@formBuilder/components/shared/LangSwitcher";
import { SectionNameInput } from "@formBuilder/components/shared/SectionNameInput";
import { PrivacyDescriptionBefore } from "./PrivacyDescriptionBefore";
import { PrivacyDescriptionBody } from "./PrivacyDescriptionBody";
import { ConfirmationTitle } from "./ConfirmationTitle";
import { SkipLinkReusable } from "@clientComponents/globals/SkipLinkReusable";

export const EditWithGroups = () => {
  const { t } = useTranslation("form-builder");
  const {
    title,
    localizeField,
    updateField,
    translationLanguagePriority,
    getLocalizationAttribute,
  } = useTemplateStore((s) => ({
    title:
      s.form[s.localizeField(LocalizedFormProperties.TITLE, s.translationLanguagePriority)] ?? "",
    localizeField: s.localizeField,
    updateField: s.updateField,
    translationLanguagePriority: s.translationLanguagePriority,
    getLocalizationAttribute: s.getLocalizationAttribute,
  }));

  const [value, setValue] = useState<string>(title);
  const searchParams = useSearchParams();
  const focusTitle = searchParams?.get("focusTitle") ? true : false;
  const titleInput = useRef<HTMLTextAreaElement>(null);
  const groupId = useGroupStore((state) => state.id);
  const getElement = useGroupStore((state) => state.getElement);

  const elements = useTemplateStore(
    (s) => (s.form.groups && s.form.groups[groupId]?.elements) || []
  );

  const groupName = useTemplateStore((s) => (s.form.groups && s.form.groups[groupId]?.name) || "");

  const updateGroupName = useGroupStore((state) => state.updateGroupName);

  const { changeKey } = useTemplateStore((s) => ({
    changeKey: s.changeKey,
  }));

  useEffect(() => {
    setValue(title);
  }, [title]);

  const _debounced = debounce(
    useCallback(
      (val: string, lang: Language) => {
        updateField(`form.${localizeField(LocalizedFormProperties.TITLE, lang)}`, val);
      },
      [updateField, localizeField]
    ),
    100
  );

  const sortedElements: FormElement[] = useMemo((): FormElement[] => {
    const sorted: FormElement[] = [];

    if (elements && elements.length > 0) {
      elements.forEach((elementId: string) => {
        const el = getElement(Number(elementId));
        if (el) {
          sorted.push(el);
        }
      });
    }
    return sorted;
    // changeKey is a timestamp that can be used to trigger a refresh on element change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elements, getElement, changeKey]);

  const updateValue = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value);
      // update the data-value attribute on the title input
      // so that the question number can be updated
      if (titleInput?.current) {
        titleInput.current.dataset.value = value;
      }
      _debounced(e.target.value, translationLanguagePriority);
    },
    // exclude _debounced from the dependency array
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setValue, translationLanguagePriority]
  );

  useEffect(() => {
    if (focusTitle) {
      titleInput && titleInput.current && titleInput.current?.focus();
    }
  }, [focusTitle]);

  const hasHydrated = useRehydrate();

  return (
    <>
      <h1 className="sr-only">{t("edit")}</h1>
      <div className="flex w-[800px]">
        <h2 id="questionsTitle" tabIndex={-1}>
          {t("questions")}
        </h2>
        <div className="ml-5 mt-2">
          <SaveButton />
        </div>
      </div>
      <SkipLinkReusable anchor="#rightPanelTitle">{t("skipLink.questionsSetup")}</SkipLinkReusable>
      <div className="flex max-w-[800px] justify-between">
        <SectionNameInput value={groupName} groupId={groupId} updateGroupName={updateGroupName} />
        <LangSwitcher descriptionLangKey="editingIn" />
      </div>
      {/* Form Intro + Title Panel */}
      {groupId === "start" && <SettingsPanel />}
      {groupId === "start" && (
        <RichTextLockedWithGroups
          hydrated={hasHydrated}
          className="rounded-t-lg"
          summaryText={t("startFormIntro")}
          beforeContent={
            <>
              <label
                htmlFor="formTitle"
                className="visually-hidden"
                {...getLocalizationAttribute()}
              >
                {t("formTitle")}
              </label>
              <div className="my-2 mb-4">
                <ExpandingInput
                  id="formTitle"
                  wrapperClassName="w-full laptop:w-3/4 mt-2 laptop:mt-0 font-bold laptop:text-3xl"
                  className="font-bold placeholder:text-slate-500 laptop:text-3xl"
                  ref={titleInput}
                  placeholder={t("placeHolderFormTitle")}
                  value={value}
                  onBlur={() => {
                    setValue(cleanInput(value));
                    //
                  }}
                  onChange={updateValue}
                  {...getLocalizationAttribute()}
                />
              </div>
            </>
          }
          addElement={false}
          schemaProperty="introduction"
          ariaLabel={t("richTextIntroTitle")}
        />
      )}
      {/* Privacy Panel */}
      {groupId === "start" && (
        <RichTextLockedWithGroups
          beforeContent={<PrivacyDescriptionBefore />}
          summaryText={t("groups.privacy.summary")}
          detailsText={
            <div className="mt-4">
              <PrivacyDescriptionBody />
            </div>
          }
          hydrated={hasHydrated}
          addElement={true}
          schemaProperty="privacyPolicy"
          ariaLabel={t("richTextPrivacyTitle")}
          className={cn(sortedElements.length === 0 && "rounded-b-lg")}
        />
      )}
      {/* Section Panel */}
      <Section groupId={groupId} />
      {/* Form Elements */}
      <div className="form-builder-editor">
        {!["end"].includes(groupId) &&
          sortedElements.map((element, index) => {
            const questionNumber = 0;
            const item = { ...element, index, questionNumber };
            return <ElementPanel elements={sortedElements} item={item} key={item.id} />;
          })}
      </div>
      {/* Confirmation*/}
      {groupId === "end" && (
        <RichTextLockedWithGroups
          summaryText={t("groups.confirmation.summary")}
          beforeContent={
            <div>
              <h2 className="my-4 text-2xl laptop:mt-0">{t("richTextConfirmationTitle")}</h2>
              <p className="mb-4">{t("groups.confirmation.beforeText")}</p>
            </div>
          }
          detailsText={
            <div className="mt-4">
              <ConfirmationDescriptionWithGroups />
              <ConfirmationTitle language={translationLanguagePriority} />
            </div>
          }
          hydrated={hasHydrated}
          addElement={false}
          schemaProperty="confirmation"
          ariaLabel={t("richTextConfirmationTitle")}
          className={"rounded-lg"}
        />
      )}
      <SkipLinkReusable anchor="#rightPanelTitle">{t("skipLink.questionsSetup")}</SkipLinkReusable>
    </>
  );
};
