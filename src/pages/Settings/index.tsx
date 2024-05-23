import { FiBook, FiDatabase, FiSettings } from "solid-icons/fi";
import Block from "../../components/Settings/SettingsBlock";
import PageTitle from "../../components/PageTitle";

export default function Settings() {
  return (
    <>
      <PageTitle>Settings</PageTitle>
      <div class="flex grid-rows-2 flex-wrap place-items-center gap-10 self-center p-10 ">
        <Block title="Library" href="/settings/library">
          <FiBook size={70} />
        </Block>
        <Block title="Metadata" href="/settings/metadata">
          <FiDatabase size={70} />
        </Block>
        <Block title="General" href="/settings/general">
          <FiSettings size={70} />
        </Block>
      </div>
    </>
  );
}
