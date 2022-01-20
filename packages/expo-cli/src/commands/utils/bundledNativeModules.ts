import { Sdks } from '@expo/api';
import JsonFile from '@expo/json-file';
import chalk from 'chalk';
import resolveFrom from 'resolve-from';

import CommandError from '../../CommandError';
import Log from '../../log';

export type BundledNativeModules = Record<string, string>;

/**
 * Gets the bundledNativeModules.json for a given SDK version:
 * - Tries to fetch the data from the /sdks/:sdkVersion/native-modules API endpoint.
 * - If the data is missing on the server (it can happen for SDKs that are yet fully released)
 *    or there's a downtime, reads the local .json file from the "expo" package.
 * - For UNVERSIONED, returns the local .json file contents.
 */
export async function getBundledNativeModulesAsync(
  projectRoot: string,
  sdkVersion: string
): Promise<BundledNativeModules> {
  if (sdkVersion === 'UNVERSIONED') {
    return await getBundledNativeModulesFromExpoPackageAsync(projectRoot);
  }

  try {
    return await Sdks.getBundledNativeModulesFromApiAsync(null, sdkVersion);
  } catch {
    Log.warn(
      `Unable to reach Expo servers. Falling back to using the cached dependency map (${chalk.bold(
        'bundledNativeModules.json'
      )}) from the package "${chalk.bold`expo`}" installed in your project.`
    );
    return await getBundledNativeModulesFromExpoPackageAsync(projectRoot);
  }
}

/**
 * Get the legacy static `bundledNativeModules.json` file
 * that's shipped with the version of `expo` that the project has installed.
 */
async function getBundledNativeModulesFromExpoPackageAsync(
  projectRoot: string
): Promise<BundledNativeModules> {
  const bundledNativeModulesPath = resolveFrom.silent(
    projectRoot,
    'expo/bundledNativeModules.json'
  );
  if (!bundledNativeModulesPath) {
    Log.addNewLineIfNone();
    throw new CommandError(
      `The dependency map ${chalk.bold(
        `expo/bundledNativeModules.json`
      )} cannot be found, please ensure you have the package "${chalk.bold`expo`}" installed in your project.\n`
    );
  }
  return await JsonFile.readAsync<BundledNativeModules>(bundledNativeModulesPath);
}
